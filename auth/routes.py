from flask import Blueprint, request, render_template, redirect, url_for
from flask_login import login_user, logout_user
from models import User

auth_bp = Blueprint("auth", __name__)

# -----------------------
# Authentication
# -----------------------
@auth_bp.route("/login", methods=["GET", "POST"])
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

@auth_bp.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("/login"))