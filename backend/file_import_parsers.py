
from models import Account, MovementType, Category, SubCategory
from extensions import db
import math
import pandas as pd


def _normalize_lookup_value(value):
    return str(value).strip().casefold() if value is not None else ""


def _normalize_text(value):
    if value is None or pd.isna(value):
        return ""
    return str(value).strip().casefold()


def _matches_movement_family(category, movement_type):
    if category is None or movement_type is None:
        return True

    category_name = _normalize_lookup_value(getattr(category, "name", ""))
    compatible_names = getattr(category, "compatible_names", []) or []
    family_names = {
        MovementType.income.value.casefold(): {"entrate", "income"},
        MovementType.expense.value.casefold(): {"spese", "expense"},
        MovementType.transfer.value.casefold(): {"transfer", "trasferimenti", "trasfer"},
    }

    expected = family_names.get(movement_type.casefold(), set())
    return category_name in expected or any(_normalize_lookup_value(name) in expected for name in compatible_names)


def resolve_category_ids(category_name, movement_type=None):
    normalized_name = _normalize_lookup_value(category_name)
    if not normalized_name:
        return None, None

    matching_subcategories = []
    for subcategory in SubCategory.query.all():
        if _normalize_lookup_value(subcategory.name) == normalized_name or any(
            _normalize_lookup_value(name) == normalized_name for name in (subcategory.compatible_names or [])
        ):
            matching_subcategories.append(subcategory)

    if movement_type is not None:
        preferred = [
            s for s in matching_subcategories
            if _matches_movement_family(s.category, movement_type)
        ]
        if preferred:
            s = preferred[0]
            return s.category_id, s.id

    for subcategory in matching_subcategories:
        return subcategory.category_id, subcategory.id

    matching_categories = []
    for category in Category.query.all():
        if _normalize_lookup_value(category.name) == normalized_name or any(
            _normalize_lookup_value(name) == normalized_name for name in (category.compatible_names or [])
        ):
            matching_categories.append(category)

    if movement_type is not None:
        preferred = [c for c in matching_categories if _matches_movement_family(c, movement_type)]
        if preferred:
            return preferred[0].id, None

    for category in matching_categories:
        return category.id, None

    return None, None

class BaseParser:

    REQUIRED_COLUMNS = set()

    @classmethod
    def matches(cls, columns):
        return cls.REQUIRED_COLUMNS.issubset(set(columns))

    @classmethod
    def parse(cls, df):
        """
        Must:
        - iterate rows
        - return List[dict]
        """
        raise NotImplementedError
    
class ParserRegistry:
    parsers = []

    @classmethod
    def register(cls, parser):
        cls.parsers.append(parser)

    @classmethod
    def detect(cls, columns):
        for parser in cls.parsers:
            if parser.matches(columns):
                return parser
        return None

class WalletExportParser(BaseParser):

    REQUIRED_COLUMNS = {
        "account",
        "category",
        "amount",
        "type",
        "note",
        "date"
    }

    @classmethod
    def parse(cls, df):

        def movement_type_from_row(row):
            e_type = _normalize_text(row.get("type"))
            e_category = _normalize_text(row.get("category"))

            transfer_aliases = {"transfer", "trasferimento", "trasfer"}
            expense_aliases = {"spese", "spesa", "expense", "expenses", "uscita", "uscite"}
            income_aliases = {"entrata", "entrate", "income", "incomes", "incoming", "ricavo", "ricavi"}

            if e_category in transfer_aliases:
                return MovementType.transfer.value
            if e_category in expense_aliases:
                return MovementType.expense.value
            if e_category in income_aliases:
                return MovementType.income.value
            if e_type in expense_aliases:
                return MovementType.expense.value
            if e_type in income_aliases:
                return MovementType.income.value

            return None

        results = []
        transfers_map = {}

        for _, row in df.iterrows():
            account_name = row.get("account")
            category_name = row.get("category")
            amount = round(float(row["amount"]), 2)
            date = row.get("date")
            date = pd.to_datetime(date).date().isoformat() if pd.notna(date) else None
            raw_note = row.get("note")
            note = "" if pd.isna(raw_note) else str(raw_note).strip()

            movement_type = movement_type_from_row(row)
            if movement_type is None:
                continue

            if movement_type == MovementType.transfer.value:
                transfer_key = (date, round(abs(amount), 2))
                stored = transfers_map.get(transfer_key)

                if stored is None:
                    transfers_map[transfer_key] = {
                        "account_name": account_name,
                        "amount": amount,
                        "date": date,
                        "note": note,
                    }
                    continue

                existing_entry = transfers_map.pop(transfer_key)
                existing_amount = float(existing_entry["amount"])

                if math.isclose(amount, -existing_amount):
                    source_account_name = existing_entry["account_name"] if amount > 0 else account_name
                    target_account_name = account_name if amount > 0 else existing_entry["account_name"]

                    source_account = Account.query.filter_by(name=source_account_name).first()
                    target_account = Account.query.filter_by(name=target_account_name).first()

                    obj = {
                        "account_id": source_account.id if source_account else None,
                        "destination_account_id": target_account.id if target_account else None,
                        "movement_type_id": movement_type,
                        "category_id": None,
                        "sub_category_id": None,
                        "amount": round(abs(amount), 2),
                        "date": date,
                        "description": note,
                    }

                    results.append(obj)
                    continue

                transfers_map[transfer_key] = {
                    "account_name": account_name,
                    "amount": amount,
                    "date": date,
                    "note": note,
                }

            else:
                account = Account.query.filter_by(name=account_name).first()
                account_id = account.id if account else None
                category_id, subcategory_id = resolve_category_ids(category_name, movement_type=movement_type)

                obj = {
                    "account_id": account_id,
                    "movement_type_id": movement_type,
                    "category_id": category_id,
                    "sub_category_id": subcategory_id,
                    "amount": amount,
                    "date": date,
                    "description": note,
                }

                results.append(obj)

        return results

ParserRegistry.register(WalletExportParser)
