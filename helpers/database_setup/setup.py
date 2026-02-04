import json
import requests
import enum

class AccountType(enum.Enum):
    cash = 'Cash'
    bank = 'Bank'
    insurance = 'Insurance'
    investment = 'Investment'

# ⚠️ Se usi session cookie dopo login, usa requests.Session()
session = requests.Session()

def load_json(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path}: {e}")
    except Exception as e:
        print(f"❌ Error loading JSON {file_path}: {e}")
    return None

def add_owner(name, endpoint):
    response = session.post(
        endpoint,
        json={"name": name}
    )

    if response.status_code == 200 or response.status_code == 201:
        print(f"✅ Added owner: {name}")
    elif response.status_code == 400:
        print(f"⚠️ Skipped '{name}': {response.json().get('error')}")
    else:
        print(f"❌ Error adding '{name}': {response.status_code} {response.text}")
        return False
    
    return True

def add_account(account_data, endpoint):
    owner_name = account_data.get("owner_name")
    name = account_data.get("name")
    account_type_str = account_data.get("account_type_str")
    if not owner_name or not name or not account_type_str:
        print(f"❌ Missing data for account: {account_data}")
        return False
    
    response = session.post(
        endpoint,
        json={
            "name": name,
            "owner_name": owner_name,
            "account_type_str": account_type_str
        }
    )

    if response.status_code == 200 or response.status_code == 201:
        print(f"✅ Added owner: {owner_name}")
    elif response.status_code == 400:
        print(f"⚠️ Skipped '{owner_name}': {response.json().get('error')}")
    else:
        print(f"❌ Error adding '{owner_name}': {response.status_code} {response.text}")
        return False
    
    return True
    
def add_category(category_data, category_endpoint, subcategory_endpoint):
    name = category_data.get("name")
    if not name:
        print(f"❌ Missing name for category: {category_data}")
        return False
    
    response = session.post(
        category_endpoint,
        json={
            "name": name
        }
    )

    if response.status_code == 200 or response.status_code == 201:
        print(f"✅ Added catgory: {name}")
    elif response.status_code == 400:
        print(f"⚠️ Skipped '{name}': {response.json().get('error')}")
    else:
        print(f"❌ Error adding '{name}': {response.status_code} {response.text}")
        return False

    subcategories = category_data.get("sub_categories", [])
    for subcat in subcategories:
        subcat_name = subcat.get("name")
        if not subcat_name:
            print(f"❌ Missing name for subcategory: {subcat}")
            return False
        
        subcat_response = session.post(
            subcategory_endpoint,
            json={
                "name": subcat_name,
                "category_name": name
            }
        )

        if subcat_response.status_code == 200 or subcat_response.status_code == 201:
            print(f"    ✅ Added subcategory: {subcat_name}")
        elif subcat_response.status_code == 400:
            print(f"    ⚠️ Skipped '{subcat_name}': {subcat_response.json().get('error')}")
        else:
            print(f"    ❌ Error adding '{subcat_name}': {subcat_response.status_code} {subcat_response.text}")
            return False

    return True

def login(username, password, endpoint):

    response = session.post(
        endpoint,
        json={"username": username, "password": password}
    )

    if response.status_code == 200:
        print("✅ Logged in successfully")
        return True
    else:
        print(f"❌ Login failed: {response.status_code} {response.text}")
    
    return False

def logout(endpoint):
    response = session.post(
        endpoint
    )

    if response.status_code == 200:
        print("✅ Logged out successfully")
        return True
    else:
        print(f"❌ Logout failed: {response.status_code} {response.text}")
    return False

if __name__ == "__main__":
    FILE_PATH = "setup.json"

    json_data = load_json(FILE_PATH)
    if not json_data:
        print("❌ Cannot proceed without valid JSON data")
        exit(1)

    api_base_url = json_data.get("api_base_url", "http://localhost:5000")
    if not api_base_url:
        print("❌ Missing API base URL in JSON")
        exit(1)

    user_data = json_data.get("user", {})
    username = user_data.get("username")
    password = user_data.get("password")
    if not username or not password:
        print("❌ Missing username or password in JSON")
        exit(1)
    
    login_endpoint = f"{api_base_url}/login"
    owners_endpoint = f"{api_base_url}/owners"
    accounts_endpoint = f"{api_base_url}/accounts"
    categories_endpoint = f"{api_base_url}/categories"
    subcategories_endpoint = f"{api_base_url}/subcategories"
    logout_endpoint = f"{api_base_url}/logout"

    if not login(username, password, login_endpoint):
        print("❌ Cannot proceed without successful login")
        exit(1)

    for owner in json_data.get("owners", []):
        if not add_owner(owner, owners_endpoint):
            print("❌ Cannot proceed without adding owners")
            exit(1)

    for account in json_data.get("accounts", []):
        if not add_account(account, accounts_endpoint):
            print("❌ Cannot proceed without adding accounts")
            exit(1)

    for category in json_data.get("categories", []):
        if not add_category(category, categories_endpoint, subcategories_endpoint):
            print("❌ Cannot proceed without adding categories")
            exit(1)

    if not logout(logout_endpoint):
        print("❌ Logout failed, but setup is complete")