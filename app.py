import os
from flask import Flask, redirect, url_for
from extensions import db, login_manager
from models import User
from api import register_api
from routes import register_routes
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "routes.login"

@login_manager.unauthorized_handler
def unauthorized_callback():
    return redirect(url_for('routes.login', unauthorized=1))

register_api(app)
register_routes(app)

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

@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
