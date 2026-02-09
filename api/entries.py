from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Entry, Account, Owner, MovementType, Category, SubCategory
from extensions import db
from datetime import datetime
from sqlalchemy import event, func, and_, or_, case

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
    
    amount = float(data.get("amount"))
    movement_type_idx = int(data.get("movement_type_index"))
    if movement_type_idx is None or movement_type_idx < 0 or movement_type_idx >= len(MovementType):
        return jsonify({"error": "Invalid movement_type"}), 400
    movement_type = list(MovementType)[movement_type_idx]

    category_id = data.get("category_id") 
    if category_id is not None:
        category = Category.query.get(category_id)
        if not category:
            if movement_type != MovementType.transfer:
                category_id = -1
            else:
                return jsonify({"error": "Invalid category"}), 400

    sub_category_id = data.get("sub_category_id")
    subcategory = None
    if sub_category_id:
        subcategory = SubCategory.query.get(sub_category_id)
        if not subcategory:
            return jsonify({"error": "Invalid subcategory"}), 400

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
        
        if amount is None or amount <= 0:
            return jsonify({"error": "amount must be positive for transfers"}), 400
    else:
        destination_account_id = None

    entry = Entry(
        owner_id=owner.id,
        account_id=account_id,
        destination_account_id=destination_account_id,
        category_id=category_id if category_id else None,
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


def get_entries(body):
    data = body or {}
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

    return query 

@entries_bp.route("/entries", methods=["POST"])
@login_required
def filter_entries():
    data = request.json or {}
    
    query = get_entries(data)
    entries = query.all() 

    result = []
    for e in entries:
        result.append({
            "id": e.id,
            "account": e.account.name,
            "destination_account": e.destination_account.name if e.destination_account else None,
            "category": e.category.name if e.category else None,
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

@entries_bp.route("/entries/aggregate", methods=["POST"])
@login_required
def aggregate_entries():
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

    account_ids = data.get("account_ids", [])
    
    query = get_entries(data)

    if account_ids:
        signed_amount = case(
            # expense from account -> negative
            (
                and_(
                    Entry.account_id.in_(account_ids),
                    Entry.movement_type == MovementType.expense
                ),
                -Entry.amount
            ),

            # income to account -> positive
            (
                and_(
                    Entry.account_id.in_(account_ids),
                    Entry.movement_type == MovementType.income
                ),
                Entry.amount
            ),

            # transfer out -> negative
            (
                and_(
                    Entry.account_id.in_(account_ids),
                    Entry.movement_type == MovementType.transfer
                ),
                -Entry.amount
            ),

            # transfer in -> positive
            (
                and_(
                    Entry.destination_account_id.in_(account_ids),
                    Entry.movement_type == MovementType.transfer
                ),
                Entry.amount
            ),

            else_=0
        )

        total_amount = query.with_entities(
            func.coalesce(func.sum(signed_amount), 0)
        ).scalar()

    else:
        # fallback to normal sum if no accounts specified
        total_amount = query.with_entities(
            func.coalesce(func.sum(Entry.amount), 0)
        ).scalar()

    return jsonify({
        "total_amount": float(total_amount)
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
        "category": {"id": entry.category.id, "name": entry.category.name} if entry.category else None,
        "subcategory": {"id": entry.subcategory.id, "name": entry.subcategory.name} if entry.subcategory else None,
        "amount": entry.amount,
        "movement_type": entry.movement_type.value,  # enum to string
        "description": entry.description,
        "date": entry.date,
    }

@entries_bp.route("/entries/pivot", methods=["POST"])
@login_required
def pivot_entries():

    data = request.json or {}

    group_by = data.get("group_by", "account")
    date_from = data.get("date", {}).get("from")
    date_to = data.get("date", {}).get("to")

    query = db.session.query(Entry)

    # -----------------------
    # Date filtering
    # -----------------------
    if date_from:
        query = query.filter(Entry.date >= date_from)

    if date_to:
        query = query.filter(Entry.date <= date_to)

    # -----------------------
    # Signed amount logic
    # -----------------------
    signed_amount = case(
        (Entry.movement_type == "income", Entry.amount),
        (Entry.movement_type == "expense", -Entry.amount),
        else_=Entry.amount
    )

    # -----------------------
    # GROUP BY selection
    # -----------------------
    if group_by == "account":

        query = query.join(
            Account,
            Account.id == Entry.account_id
        )

        group_id_col = Account.id
        group_name_col = Account.name

    elif group_by == "category":

        query = query.join(
            Category,
            Category.id == Entry.category_id
        )

        group_id_col = Category.id
        group_name_col = Category.name

    elif group_by == "owner":

        query = query.join(
            Owner,
            Owner.id == Entry.owner_id
        )

        group_id_col = Owner.id
        group_name_col = Owner.name

    else:
        return jsonify({"error": "Invalid group_by"}), 400

    # -----------------------
    # Aggregation
    # -----------------------
    results = (
        query.with_entities(
            group_id_col.label("group_id"),
            group_name_col.label("group_name"),
            func.coalesce(func.sum(signed_amount), 0).label("total_amount")
        )
        .group_by(group_id_col, group_name_col)
        .order_by(group_name_col)
        .all()
    )

    response = [
        {
            "group_by_id": r.group_id,
            "group_by_name": r.group_name,
            "total_amount": float(r.total_amount)
        }
        for r in results
    ]

    return jsonify(response)

@event.listens_for(Entry, "before_insert")
@event.listens_for(Entry, "before_update")
def validate_entry(mapper, connection, target):
    if target.movement_type == MovementType.transfer:
        if not target.destination_account_id:
            raise ValueError("destination_account_id is required for transfers")
    else:
        if target.destination_account_id is not None:
            raise ValueError("destination_account_id must be NULL for non-transfer movements")
