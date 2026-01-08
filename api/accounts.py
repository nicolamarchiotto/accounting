from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Account, AccountType, Entry
from extensions import db

accounts_bp = Blueprint("accounts", __name__)

@accounts_bp.route("/accounts", methods=["POST"])
@login_required
def accounts():
    data = request.json

    owner_id = data.get("owner_id")
    account_type_str = data.get("account_type")
    account_name = data.get("name")

    if(not account_name or not owner_id or not account_type_str):
        return jsonify({"error": "owner_id and account_type are required"}), 400
    
    try:
        account_type_enum = AccountType(account_type_str)
    except ValueError:
        return jsonify({"error": "Invalid account type"}), 400

    account = Account(
        name=account_name,
        account_type=account_type_enum,
        owner_id=owner_id
    )

    db.session.add(account)
    db.session.commit()
    return {"status": "ok"}, 200

@accounts_bp.route("/accounts", methods=["GET"])
@login_required
def get_accounts():
    return jsonify([
        {
            "id": a.id,
            "name": a.name,
            "owner": a.owner.name,
            "account_type": a.account_type.value
        }
        for a in Account.query.all()
    ]), 200


@accounts_bp.route("/accounts/info/<int:account_id>", methods=["DELETE"])
@login_required
def info_account(account_id):
    account = Account.query.get_or_404(account_id)
    entries_count = Entry.query.filter_by(account_id=account.id).count()

    return jsonify({
        "account_id": account.id,
        "account_name": account.name,
        "owner_name": account.owner.name,
        "entries_count": entries_count
    })

@accounts_bp.route("/accounts/remove/<int:account_id>", methods=["DELETE"])
@login_required
def remove_account(account_id):

    try:
        account = Account.query.get_or_404(account_id)

        if not account:
            return jsonify({"error": "account not found"}), 404
        
        # Remove entries first
        Entry.query.filter_by(account_id=account.id).delete()
        db.session.delete(account)
        
        db.session.commit()
        return jsonify({"success": True, "message": f"account with ID {account_id} deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete account", "details": str(e)}), 500
    

@accounts_bp.route("/accounts/edit/<int:account_id>", methods=["PUT"])
@login_required
def account(account_id):
    data = request.get_json()
    new_name = data.get("name", "").strip()
    new_account_type = data.get("account_type", "").strip()
    new_owner_id = data.get("owner_id", "").strip()
    
    if not new_name or not new_account_type or not new_owner_id:
        return jsonify({"error": "New name is required"}), 400
    
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "account not found"}), 404
    
    try:
        account.name = new_name
        account.account_type = AccountType(new_account_type)
        account.owner_id = new_owner_id
        db.session.commit()
        return jsonify({"success": True, "message": f"account with ID {account_id} updated", "account": {"id": account.id, "name": account.name}})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update account", "details": str(e)}), 500


@accounts_bp.route("/account/types", methods=["GET"])
@login_required
def account_types():
    account_types = [atype.value for atype in AccountType]
    return jsonify(account_types)