from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Entry, Account, Owner, MovementType, Category, SubCategory
from extensions import db
from datetime import datetime

entries_bp = Blueprint("entries", __name__)

# POST /entries
@entries_bp.route("/entries", methods=["POST"])
@login_required
def add_entry():
    data = request.json

    # Extract owner name and find the owner
    data = request.json

    owner_name = data.get("owner")
    owner_id = data.get("owner_id")

    if owner_name:
        owner = Owner.query.filter_by(name=owner_name).first()
    elif owner_id:
        owner = Owner.query.get(owner_id)
    else:
        return jsonify({"error": "Missing owner"}), 400

    if not owner:
        return jsonify({"error": "Owner not found"}), 400

    # Extract account_id and verify account belongs to owner
    account_id = data.get("account_id")
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Invalid account"}), 400

    # Extract other required fields
    category_id = data.get("category_id")
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Invalid category"}), 400

    sub_category_id = data.get("sub_category_id")
    subcategory = None
    if sub_category_id:
        subcategory = SubCategory.query.get(sub_category_id)
        if not subcategory:
            return jsonify({"error": "Invalid subcategory"}), 400

    amount = data.get("amount")
    movement_type = data.get("movement_type")
    description = data.get("description")
    destination_account_id = data.get("destination_account_id")
    date = data.get("date")

    if movement_type == MovementType.transfer:
        if not destination_account_id:
            return jsonify({"error": "destination_account_id required for transfer"}), 400

        destination_account = Account.query.get(destination_account_id)
        if not destination_account:
            return jsonify({"error": "Invalid destination_account"}), 400

        if destination_account_id == account_id:
            return jsonify({"error": "source and destination accounts must differ"}), 400
    else:
        destination_account_id = None

    # Validate movement_type enum
    try:
        movement_enum = MovementType[movement_type]
    except KeyError:
        return jsonify({"error": "Invalid movement type"}), 400

    entry = Entry(
        owner_id=owner.id,
        account_id=account_id,
        category_id=category_id,
        sub_category_id=sub_category_id if sub_category_id else None,
        amount=amount,
        movement_type=movement_enum,
        description=description,
        date=date
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"status": "ok", "id": entry.id})

# GET /entries
@entries_bp.route("/entries", methods=["GET"])
@login_required
def get_entries():
    entries = Entry.query.all()
    return jsonify([serialize_entry(e) for e in entries])


@entries_bp.route("/entries/filter", methods=["POST"])
@login_required
def filter_entries():
    data = request.json or {}

    owners = data.get("owners", [])
    accounts = data.get("accounts", [])
    movement_types = data.get("movement_types", [])
    categories = data.get("categories", [])
    date_from = data.get("date_from")
    date_to = data.get("date_to")

    # Base query
    query = Entry.query.join(Account).join(Owner).join(Category)

    # Filter owners
    if owners:
        query = query.filter(Account.owner_id.in_(owners))

    # Filter accounts
    if accounts:
        query = query.filter(Entry.account_id.in_(accounts))
    else:
        # If accounts empty but owners provided, filter accounts by owners
        if owners:
            query = query.filter(Account.owner_id.in_(owners))
        # else no filter needed here (all accounts)

    # Filter movement_types
    if movement_types:
        # Convert strings to MovementType enum values
        try:
            movement_enums = [MovementType[mt] for mt in movement_types]
            query = query.filter(Entry.movement_type.in_(movement_enums))
        except KeyError:
            return jsonify({"error": "Invalid movement_type in filter"}), 400

    # Filter categories
    if categories:
        query = query.filter(Entry.category_id.in_(categories))

    # Filter date range
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(Entry.date >= dt_from.date())
        except Exception:
            return jsonify({"error": "Invalid date_from format"}), 400
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(Entry.date <= dt_to.date())
        except Exception:
            return jsonify({"error": "Invalid date_to format"}), 400

    entries = query.all()

    result = []
    for e in entries:
        result.append({
            "id": e.id,
            "account": f"{e.account.name} ({e.account.owner.name} - {e.account.account_type.name})",
            "category": e.category.name,
            "subcategory": e.subcategory.name if e.subcategory else None,
            "movement_type": e.movement_type.name,
            "amount": e.amount,
            "description": e.description,
            "date": e.date.isoformat() if hasattr(e.date, "isoformat") else e.date
        })
    return jsonify(result)


@entries_bp.route("/movement_types", methods=["GET"])
@login_required
def get_movement_types():
    movement_types = [mt.value for mt in MovementType]
    return jsonify(movement_types)

def serialize_entry(entry):
    return {
        "id": entry.id,
        "owner": {"id": entry.owner.id, "name": entry.owner.name},
        "account": {
            "id": entry.account.id,
            "name": entry.account.name,
            "account_type": entry.account.account_type.value  # enum to string
        },
        "destination_account": (
            {
                "id": entry.destination_account.id,
                "name": entry.destination_account.name
            }
            if entry.destination_account else None
        ),
        "category": {"id": entry.category.id, "name": entry.category.name},
        "subcategory": {"id": entry.subcategory.id, "name": entry.subcategory.name} if entry.subcategory else None,
        "amount": entry.amount,
        "movement_type": entry.movement_type.value,  # enum to string
        "description": entry.description,
        "date": entry.date,
    }