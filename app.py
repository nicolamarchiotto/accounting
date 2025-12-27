import os
from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_login import (
    LoginManager,
    login_user,
    login_required,
    logout_user,
    current_user,
)
from dotenv import load_dotenv

from models import db, User, Entry, AccountType, Account, Category, SubCategory, MovementType, Owner

from sqlalchemy import and_, or_
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

login_manager = LoginManager(app)
login_manager.login_view = "login"

# -----------------------
# Initialization flag
# -----------------------
init_done = False


@app.before_request
def initialize_once():
    global init_done
    if init_done:
        return

    with app.app_context():
        db.create_all()

        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin_username and admin_password:
            admin = User.query.filter_by(username=admin_username).first()
            if not admin:
                admin = User(username=admin_username)
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()

    init_done = True


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# -----------------------
# Authentication
# -----------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("index"))

        return "Invalid credentials", 401

    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


# -----------------------
# Pages
# -----------------------
@app.route("/")
@login_required
def index():
    return render_template("index.html")

@app.route('/owners', methods=['GET'])
def get_owners():
    owners = Owner.query.all()
    return jsonify([{"id": o.id, "name": o.name} for o in owners])

@app.route('/owners', methods=['POST'])
def add_owner():
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    # Check if owner already exists
    existing_owner = Owner.query.filter_by(name=name).first()
    if existing_owner:
        return jsonify({"error": "Owner already exists"}), 400

    new_owner = Owner(name=name)
    db.session.add(new_owner)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error: " + str(e)}), 500

    return jsonify({"id": new_owner.id, "name": new_owner.name}), 201

@app.route("/accounts", methods=["GET", "POST"])
@login_required
def accounts():
    if request.method == "POST":
        data = request.json

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


@app.route("/categories", methods=["GET", "POST"])
@login_required
def categories():
    if request.method == "POST":
        name = request.json.get("name")
        if not name:
            return jsonify({"error": "Name required"}), 400
        category = Category(name=name)
        db.session.add(category)
        db.session.commit()
        return jsonify({"id": category.id, "name": category.name})

    categories = Category.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories])

@app.route("/subcategories", methods=["GET", "POST"])
@login_required
def subcategories():
    if request.method == "POST":
        data = request.json
        name = data.get("name")
        category_id = data.get("category_id")
        if not name or not category_id:
            return jsonify({"error": "Name and category_id required"}), 400
        # Validate category exists
        if not Category.query.get(category_id):
            return jsonify({"error": "Invalid category_id"}), 400

        subcat = SubCategory(name=name, category_id=category_id)
        db.session.add(subcat)
        db.session.commit()
        return jsonify({"id": subcat.id, "name": subcat.name, "category_id": category_id})

    # Optional: filter by category_id query param
    category_id = request.args.get("category_id")
    query = SubCategory.query
    if category_id:
        query = query.filter_by(category_id=category_id)

    subcategories = query.all()
    return jsonify([{"id": s.id, "name": s.name, "category_id": s.category_id} for s in subcategories])


# POST /entries
@app.route("/entries", methods=["POST"])
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
    if not account or account.owner_id != owner.id:
        return jsonify({"error": "Invalid account or account does not belong to owner"}), 400

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
    date = data.get("date")

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
@app.route("/entries", methods=["GET"])
def get_entries():
    entries = Entry.query.all()
    return jsonify([serialize_entry(e) for e in entries])

@app.route("/entries/filter", methods=["POST"])
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

def serialize_entry(entry):
    return {
        "id": entry.id,
        "owner": {"id": entry.owner.id, "name": entry.owner.name},
        "account": {
            "id": entry.account.id,
            "name": entry.account.name,
            "account_type": entry.account.account_type.value  # enum to string
        },
        "category": {"id": entry.category.id, "name": entry.category.name},
        "subcategory": {"id": entry.subcategory.id, "name": entry.subcategory.name} if entry.subcategory else None,
        "amount": entry.amount,
        "movement_type": entry.movement_type.value,  # enum to string
        "description": entry.description,
        "date": entry.date,
    }

def serialize_account(account):
    return {
        "id": account.id,
        "name": account.name,
        "account_type": account.account_type.value,  # enum to string
        "owner_id": account.owner_id,
    }

@app.route("/movement_types", methods=["GET"])
@login_required
def get_movement_types():
    movement_types = [mt.value for mt in MovementType]
    return jsonify(movement_types)

@app.route("/account_types", methods=["GET"])
@login_required
def account_types():
    account_types = [atype.value for atype in AccountType]
    return jsonify(account_types)

if __name__ == "__main__":
    app.run(debug=True)
