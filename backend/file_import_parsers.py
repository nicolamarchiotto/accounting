
from models import Account, MovementType, Category, SubCategory
from extensions import db
import pandas as pd

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
            e_type = row.get("type")
            e_category = row.get("category")
            
            result = MovementType.transfer.value

            if e_category == "TRANSFER":
                result = MovementType.transfer.value
            elif e_type == "Spese":
                result = MovementType.expense.value
            elif e_type == "Entrata":
                result = MovementType.income.value
                
            return result
        
        results = []

        transfers_map = {}

        for _, row in df.iterrows():
            account_name = row.get("account")
            category_name = row.get("category")
            amount = round(float(row["amount"]), 2)
            date = row.get("date") # this should probably be converted to compatible date
            date = pd.to_datetime(date).date().isoformat() if pd.notna(date) else None
            raw_note = row.get("note")
            note = "" if pd.isna(raw_note) else str(raw_note).strip()
            
            movement_type = movement_type_from_row(row)
            if movement_type == MovementType.transfer.value:
                # file cosntructs two separate rows for transfers
                # identify the two trasnfer rows by date and opposite amount
                key_to_check = (date, -amount)
                if key_to_check not in transfers_map:
                    transfers_map[(date, amount)] = { 
                        "account_name": account_name,
                        "category_name": category_name,
                        "amount": amount,
                        "date": date,
                        "note": note,
                        "type": type
                    }
                else:
                    existing_entry = transfers_map[key_to_check]

                    existing_entry_account = Account.query.filter_by(name=existing_entry["account_name"]).first()
                    existing_entry_account_id = existing_entry_account.id if existing_entry_account else None

                    current_entry_account = Account.query.filter_by(name=account_name).first()
                    current_entry_account_id = current_entry_account.id if current_entry_account else None

                    source_account_id = -1
                    target_account_id = -1

                    # source account should be the one corresponding with entry with negative account 
                    if amount < 0:
                        source_account_id = existing_entry_account_id
                        target_account_id = current_entry_account_id  
                    else:
                        source_account_id = current_entry_account_id
                        target_account_id = existing_entry_account_id  
                    
                    obj = {
                        "account_id": source_account_id,
                        "destination_account_id": target_account_id,  
                        "movement_type_id": movement_type,
                        "category_id": None,
                        "sub_category_id": None,
                        "amount": amount,
                        "date": date,
                        "description": note
                    }

                    results.append(obj)

                    del transfers_map[key_to_check]

            else:
                account = Account.query.filter_by(name=account_name).first()
                account_id = account.id if account else None 
                category_id = None
                subcategory_id = None

                subcategory = SubCategory.query.filter_by(name=category_name).first()
                if subcategory:
                    category_id = subcategory.category_id
                    subcategory_id = subcategory.id
                else:
                    category = Category.query.filter_by(name=category_name).first()
                    if category:
                        category_id = category.id

                obj = {
                    "account_id": account_id,
                    "movement_type_id": movement_type,
                    "category_id": category_id,
                    "sub_category_id": subcategory_id,
                    "amount": amount,
                    "date": date,
                    "description": note
                }

                results.append(obj)

        return results

ParserRegistry.register(WalletExportParser)
