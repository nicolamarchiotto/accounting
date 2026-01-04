from flask import Blueprint, request, render_template, redirect, url_for, jsonify
from flask_login import login_user, logout_user
from models import User

routes_bp = Blueprint("routes", __name__)

# -----------------------
# Authentication
# -----------------------
@routes_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json()

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        username = data.get("username")
        password = data.get("password")

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return jsonify({"success": True})
        
        return jsonify({"error": "Invalid credentials"}), 401

    return render_template("login.html")

@routes_bp.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("/login"))

@routes_bp.route("/tabs/owners")
def tab_owners():
    return render_template("tabs/owners.html")

@routes_bp.route("/tabs/accounts")
def tab_accounts():
    return render_template("tabs/accounts.html")

@routes_bp.route("/tabs/categories")
def tab_categories():
    return render_template("tabs/categories.html")

@routes_bp.route("/tabs/entries")
def tab_entries():
    return render_template("tabs/entries.html")