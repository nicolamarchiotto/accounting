import os
from flask import Flask, redirect, url_for
from extensions import db, login_manager
from models import User
from api import register_api
from routes import register_routes
from dotenv import load_dotenv

load_dotenv()

sql_database_name = os.getenv("SQL_DATABASE_NAME")
sql_username = os.getenv("SQL_USERNAME")
sql_password = os.getenv("SQL_PASSWORD")

if sql_username and sql_password and sql_database_name:

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = (
            f"postgresql://{sql_username}:{sql_password}@localhost/{sql_database_name}"
        )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "routes.login"

    @login_manager.unauthorized_handler
    def unauthorized_callback():
        return redirect(url_for('routes.login', unauthorized=1))

    register_api(app)
    register_routes(app)

    print("Starting application...")
    with app.app_context():
        # db.drop_all() to reset database during development
        db.create_all()
        admin_username = os.getenv("UI_USERNAME")
        admin_password = os.getenv("UI_PASSWORD")
        if admin_username and admin_password:
            admin = User.query.filter_by(username=admin_username).first()
            if not admin:
                admin = User(username=admin_username)
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()

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
        print("Running Flask app...")
        app.run(host='0.0.0.0', port=5000, debug=True)
else:
    print("Database configuration is missing. Please set SQL_USERNAME, SQL_PASSWORD, and SQL_DATABASE_NAME environment variables.")
