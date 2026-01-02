from .routes import auth_bp

def register_auth(app):
    app.register_blueprint(auth_bp)