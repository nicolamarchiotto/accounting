from flask import Blueprint, request, jsonify
from flask_login import (
    login_required
)
from models import Account, AccountType
from extensions import db

accounts_bp = Blueprint("accounts", __name__)


@accounts_bp.route("/accounts", methods=["GET", "POST"])
@login_required
def accounts():
    if request.method == "POST":
        data = request.json

        owner_id = data.get("owner_id")
        account_type_str = data.get("account_type")
        try:
            account_type_enum = AccountType(account_type_str)
        except ValueError:
            return jsonify({"error": "Invalid account type"}), 400

        account = Account(
            name=data.get("name"),
            account_type=account_type_enum,
            owner_id=owner_id
        )

        db.session.add(account)
        db.session.commit()
        return {"status": "ok"}

    return jsonify([
        {
            "id": a.id,
            "name": a.name,
            "account_type": a.account_type.value,
            "owner": a.owner.name
        }
        for a in Account.query.all()
    ])

@accounts_bp.route("/account_types", methods=["GET"])
@login_required
def account_types():
    account_types = [atype.value for atype in AccountType]
    return jsonify(account_types)