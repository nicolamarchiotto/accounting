from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Entry, Account, Owner, MovementType, Category, SubCategory
from extensions import db
from datetime import datetime
from sqlalchemy import event, or_

entries_bp = Blueprint("entries", __name__)

# POST /entries
@entries_bp.route("/entries/add", methods=["POST"])
@login_required
def add_entry():
    data = request.json

    # Extract owner name and find the owner
    data = request.json

    # Extract account_id and verify account belongs to owner
    account_id = data.get("account_id")
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Invalid account"}), 400

    owner = Owner.query.get(account.owner_id)
    
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
    movement_type_idx = int(data.get("movement_type_index"))
    print(movement_type_idx)  
    if movement_type_idx is None or movement_type_idx < 0 or movement_type_idx >= len(MovementType):
        return jsonify({"error": "Invalid movement_type"}), 400
    movement_type = list(MovementType)[movement_type_idx]

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

    entry = Entry(
        owner_id=owner.id,
        account_id=account_id,
        category_id=category_id,
        sub_category_id=sub_category_id if sub_category_id else None,
        amount=amount,
        movement_type=movement_type,
        description=description,
        date=date
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"status": "ok", "id": entry.id})

@entries_bp.route("/entries/remove/<int:entry_id>", methods=["DELETE"])
@login_required
def remove_entry(entry_id):
    try:
        entry = Entry.query.get_or_404(entry_id)
        db.session.delete(entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to remove entry", "details": str(e)}), 500

    return jsonify({"success": True})

@entries_bp.route("/entries/edit/<int:entry_id>", methods=["PUT"])
@login_required
def edit_entry(entry_id):
    data = request.json

    entry = Entry.query.get_or_404(entry_id)

    if( not entry):
        return jsonify({"error": "Entry not found"}), 404

    # Required fields
    amount = data.get("amount")
    movement_type_index = int(data.get("movement_type_index"))
    description = data.get("description")
    date = data.get("date")
    category_id = data.get("category_id")

    # Optional
    sub_category_id = data.get("sub_category_id")
    destination_account_id = data.get("destination_account_id")
    movement_type = list(MovementType)[movement_type_index]

    if not all([amount, movement_type, date, category_id]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        entry.movement_type = movement_type
    except ValueError:
        return jsonify({"error": "Invalid movement type"}), 400

    entry.amount = float(amount)
    entry.description = description
    entry.date = date
    entry.category_id = category_id
    entry.sub_category_id = sub_category_id

    # Transfer logic
    if entry.movement_type == MovementType.transfer:
        if not destination_account_id:
            return jsonify({"error": "Destination account required for transfer"}), 400
        entry.destination_account_id = destination_account_id
    else:
        entry.destination_account_id = None

    try:
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@entries_bp.route("/entries", methods=["POST"])
@login_required
def filter_entries():
    data = request.json or {}
    if( not data ):
        data = {
            "owners": [],
            "account_ids": [],
            "movement_types": [],
            "category_ids": [],
            "subcategory_ids": [],
            "date": {"from": None, "to": None},
            "amount": {"min": None, "max": None},
            "description": ""
        }
        
    owners = data.get("owners", [])
    account_ids = data.get("account_ids", [])
    movement_types = data.get("movement_types", [])
    category_ids = data.get("category_ids", [])
    subcategory_ids = data.get("subcategory_ids", [])
    date = data.get("date", {"from": None, "to": None})
    date_from = date.get("from")
    date_to = date.get("to")
    amount = data.get("amount", {"min": None, "max": None})
    amount_min = amount.get("min")
    amount_max = amount.get("max")
    description = data.get("description", "").strip()
    
    # Base query
    query = Entry.query

    # Filter owners
    if owners and owners != []:
        query = query.filter(Account.owner_id.in_(owners))

    # Filter accounts
    if account_ids and account_ids != []:
        query = query.filter(
            or_(
                Entry.account_id.in_(account_ids),
                Entry.destination_account_id.in_(account_ids)
            )
        )
    else:
        # If accounts empty but owners provided, filter accounts by owners
        if owners and owners != []:
            query = query.filter(Account.owner_id.in_(owners))
        
    # Filter movement_types
    if movement_types and movement_types != []:
        try:
            movement_enums = [MovementType[mt.lower()] for mt in movement_types]
            query = query.filter(Entry.movement_type.in_(movement_enums))
        except KeyError as e:
            return jsonify({"error": f"Invalid movement_type: {e.args[0]}"}), 400

    # Filter categories
    if category_ids and category_ids != []:
        query = query.filter(Entry.category_id.in_(category_ids))

    if subcategory_ids and subcategory_ids != []:
        query = query.filter(Entry.subcategory_id.in_(subcategory_ids))

    # Filter description keywords
    if description:
        words = [w.strip() for w in description.split() if w.strip()]

        if words:
            query = query.filter(
                or_(
                    *[Entry.description.ilike(f"%{word}%") for word in words]
                )
            )

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

    # Filter amount range
    if amount_min is not None:
        try:
            min_val = float(amount_min)
            query = query.filter(Entry.amount >= min_val)
        except ValueError:
            return jsonify({"error": "Invalid amount min value"}), 400
    if amount_max is not None:
        try:
            max_val = float(amount_max)
            query = query.filter(Entry.amount <= max_val)
        except ValueError:
            return jsonify({"error": "Invalid amount max value"}), 400

    entries = query.all()
    result = []
    for e in entries:
        result.append({
            "id": e.id,
            "account": e.account.name,
            "category": e.category.name,
            "subcategory": e.subcategory.name if e.subcategory else None,
            "movement_type": e.movement_type.name,
            "amount": e.amount,
            "description": e.description,
            "date": e.date.isoformat() if hasattr(e.date, "isoformat") else e.date
        })

    page = data.get("page", 1)
    per_page = data.get("per_page", 20)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "items": [serialize_entry(e) for e in pagination.items],
        "total": pagination.total,
        "page": page
    })


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

@event.listens_for(Entry, "before_insert")
@event.listens_for(Entry, "before_update")
def validate_entry(mapper, connection, target):
    if target.movement_type == MovementType.transfer:
        if not target.destination_account_id:
            raise ValueError("destination_account_id is required for transfers")
    else:
        if target.destination_account_id is not None:
            raise ValueError("destination_account_id must be NULL for non-transfer movements")