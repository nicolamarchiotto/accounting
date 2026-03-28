from extensions import db
from flask_login import UserMixin
import enum
from sqlalchemy import Date
from sqlalchemy.orm import validates
import re

class MovementType(enum.Enum):
    expense = 'Expense'
    income = 'Income'
    transfer = 'Transfer'

class AccountType(enum.Enum):
    cash = 'Cash'
    bank = 'Bank'
    insurance = 'Insurance'
    investment = 'Investment'

HEX_COLOR_REGEX = re.compile(r"^#([A-Fa-f0-9]{6})$")

# ------------------------
# Authentication user
# ------------------------

class User(UserMixin, db.Model):  # UserMixin here for Flask-Login
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)  # usa Text per stringa senza limite

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    # Flask-Login compatibility (already handled by UserMixin)
    is_active = True

# ------------------------
# Owner (real person/entity)
# ------------------------
class Owner(db.Model):
    __tablename__ = "owners"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    accounts = db.relationship("Account", back_populates="owner")
    entries = db.relationship("Entry", back_populates="owner")

class Account(db.Model):
    __tablename__ = "accounts"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    account_type = db.Column(db.Enum(AccountType), nullable=False)
    start_amount = db.Column(db.Float, nullable=False, default=0.0)

    owner_id = db.Column(db.Integer, db.ForeignKey("owners.id"), nullable=False)
    owner = db.relationship("Owner", back_populates="accounts")

    iban = db.Column(db.String(34), nullable=True)
    serial = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(7), nullable=False, default="#E3F2FD")
    
    # Source account entries
    entries = db.relationship(
        "Entry",
        foreign_keys="Entry.account_id",
        back_populates="account"
    )

    # Destination account (transfers)
    incoming_transfers = db.relationship(
        "Entry",
        foreign_keys="Entry.destination_account_id",
        back_populates="destination_account"
    )

    @validates("color")
    def validate_color(self, key, value):
        if value is None:
            return value  # allow null

        if not isinstance(value, str):
            raise ValueError("Color must be a string")

        if not HEX_COLOR_REGEX.match(value):
            raise ValueError(
                "Invalid color format. Use hex format like '#AABBCC'"
            )

        return value.upper()  # normalize


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    subcategories = db.relationship("SubCategory", back_populates="category")
    entries = db.relationship("Entry", back_populates="category")


class SubCategory(db.Model):
    __tablename__ = "subcategories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)

    category = db.relationship("Category", back_populates="subcategories")
    entries = db.relationship("Entry", back_populates="subcategory")
    
class Entry(db.Model):
    __tablename__ = "entries"

    id = db.Column(db.Integer, primary_key=True)

    owner_id = db.Column(db.Integer, db.ForeignKey("owners.id"), nullable=False)

    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    destination_account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=True)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    sub_category_id = db.Column(db.Integer, db.ForeignKey("subcategories.id"), nullable=True)

    amount = db.Column(db.Float, nullable=False)
    movement_type = db.Column(db.Enum(MovementType), nullable=False)
    description = db.Column(db.String(100), nullable=False)
    date = db.Column(Date, nullable=False)

    owner = db.relationship("Owner")

    account = db.relationship(
        "Account",
        foreign_keys=[account_id],
        back_populates="entries"
    )

    destination_account = db.relationship(
        "Account",
        foreign_keys=[destination_account_id],
        back_populates="incoming_transfers"
    )

    category = db.relationship("Category", back_populates="entries")
    subcategory = db.relationship("SubCategory", back_populates="entries")