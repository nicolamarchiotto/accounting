from .owners import owners_bp
from .accounts import accounts_bp
from .categories import categories_bp
from .entries import entries_bp

def register_api(app):
    app.register_blueprint(owners_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(entries_bp)
