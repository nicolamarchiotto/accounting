// Globals for cached data
let owners = [];
let accounts = [];
let categories = [];
let subcategories = [];
let movementTypes = [];

// Utility to fill select options
function fillSelect(selectElem, items, valueField="id", textField="name", includeEmpty=true) {
    selectElem.innerHTML = "";
    if (includeEmpty) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "-- Select --";
        selectElem.appendChild(option);
    }
    for (const item of items) {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElem.appendChild(option);
    }
}

// Utility to fill multi-select options
function fillMultiSelect(selectElem, items, valueField="id", textField="name") {
    selectElem.innerHTML = "";
    for (const item of items) {
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField];
        selectElem.appendChild(option);
    }
}

async function fetchJson(url, method="GET", body=null) {
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
    }
    return res.json();
}

async function loadDropdowns() {
    // Owners
    owners = await fetchJson("/owners");
    fillSelect(document.getElementById("owner-for-account"), owners);
    fillSelect(document.getElementById("entry-owner"), owners);
    fillMultiSelect(document.getElementById("filter-owners"), owners);

    // Accounts
    accounts = await fetchJson("/accounts");
    fillSelect(document.getElementById("entry-account"), accounts);
    fillMultiSelect(document.getElementById("filter-accounts"), accounts);

    // Categories
    categories = await fetchJson("/categories");
    fillSelect(document.getElementById("category-for-subcategory"), categories);
    fillSelect(document.getElementById("entry-category"), categories);
    fillMultiSelect(document.getElementById("filter-categories"), categories);

    // Subcategories
    subcategories = await fetchJson("/subcategories");
    fillSelect(document.getElementById("entry-subcategory"), subcategories);

    // Movement Types - fetch from backend enum API or hardcoded if no endpoint
    movementTypes = await fetchJson("/movement_types");
    fillSelect(document.getElementById("account-type"), Object.entries(movementTypes).map(([k,v]) => ({ id: v, name: k })));
    fillSelect(document.getElementById("entry-movement-type"), Object.entries(movementTypes).map(([k,v]) => ({ id: v, name: k })));
    fillMultiSelect(document.getElementById("filter-movement-types"), Object.entries(movementTypes).map(([k,v]) => ({ id: v, name: k })));
}

// When category changes, update subcategories dropdown
document.getElementById("category-for-subcategory").addEventListener("change", () => {
    const selectedCatId = document.getElementById("category-for-subcategory").value;
    const filteredSubcats = selectedCatId ? subcategories.filter(sc => sc.category_id == selectedCatId) : [];
    fillSelect(document.getElementById("entry-subcategory"), filteredSubcats);
});

document.getElementById("entry-category").addEventListener("change", () => {
    const selectedCatId = document.getElementById("entry-category").value;
    const filteredSubcats = selectedCatId ? subcategories.filter(sc => sc.category_id == selectedCatId) : [];
    fillSelect(document.getElementById("entry-subcategory"), filteredSubcats);
});

// Login
document.getElementById("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
        await fetchJson("/login", "POST", {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        });
        alert("Login successful");
        document.getElementById("login-section").style.display = "none";
        document.getElementById("add-data-section").style.display = "block";
        document.getElementById("filter-entries-section").style.display = "block";
        document.getElementById("entries-section").style.display = "block";
        document.getElementById("logout-button").style.display = "inline-block";

        await loadDropdowns();
        await loadEntries();
    } catch (err) {
        alert("Login failed: " + err.message);
    }
});

// Logout
document.getElementById("logout-button").addEventListener("click", async () => {
    await fetchJson("/logout", "POST");
    alert("Logged out");
    document.getElementById("login-section").style.display = "block";
    document.getElementById("add-data-section").style.display = "none";
    document.getElementById("filter-entries-section").style.display = "none";
    document.getElementById("entries-section").style.display = "none";
    document.getElementById("logout-button").style.display = "none";
});

// Add Owner
document.getElementById("add-owner").addEventListener("click", async () => {
    const name = document.getElementById("owner-name").value.trim();
    if (!name) { alert("Owner name required"); return; }
    try {
        await fetchJson("/owners", "POST", { name });
        alert("Owner added");
        document.getElementById("owner-name").value = "";
        await loadDropdowns();
    } catch (err) { alert("Failed to add owner: " + err.message); }
});

// Add Account
document.getElementById("add-account").addEventListener("click", async () => {
    const ownerId = document.getElementById("owner-for-account").value;
    const name = document.getElementById("account-name").value.trim();
    const accountType = document.getElementById("account-type").value;
    if (!ownerId || !name || !accountType) { alert("Owner, Account Name and Account Type required"); return; }
    try {
        await fetchJson("/accounts", "POST", { owner_id: ownerId, name, account_type: accountType });
        alert("Account added");
        document.getElementById("account-name").value = "";
        await loadDropdowns();
    } catch (err) { alert("Failed to add account: " + err.message); }
});

// Fetch account types and populate the dropdown
fetch("/account_types")
  .then(response => response.json())
  .then(accountTypes => {
    const accountTypeSelect = document.getElementById("account-type-select");
    accountTypeSelect.innerHTML = "";
    accountTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // optional capitalization
      accountTypeSelect.appendChild(option);
    });
  });

fetch("/movement_types")
.then(response => response.json())
.then(movementTypes => {
    const movementSelect = document.getElementById("movement-type-select");
    movementSelect.innerHTML = "";
    movementTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    movementSelect.appendChild(option);
    });
});

// Add Category
document.getElementById("add-category").addEventListener("click", async () => {
    const name = document.getElementById("category-name").value.trim();
    if (!name) { alert("Category name required"); return; }
    try {
        await fetchJson("/categories", "POST", { name });
        alert("Category added");
        document.getElementById("category-name").value = "";
        await loadDropdowns();
    } catch (err) { alert("Failed to add category: " + err.message); }
});

// Add SubCategory
document.getElementById("add-subcategory").addEventListener("click", async () => {
    const categoryId = document.getElementById("category-for-subcategory").value;
    const name = document.getElementById("subcategory-name").value.trim();
    if (!categoryId || !name) { alert("Category and SubCategory name required"); return; }
    try {
        await fetchJson("/subcategories", "POST", { category_id: categoryId, name });
        alert("SubCategory added");
        document.getElementById("subcategory-name").value = "";
        await loadDropdowns();
    } catch (err) { alert("Failed to add subcategory: " + err.message); }
});

// Add Entry
document.getElementById("add-entry").addEventListener("click", async () => {
    const ownerId = document.getElementById("entry-owner").value;
    const accountId = document.getElementById("entry-account").value;
    const categoryId = document.getElementById("entry-category").value;
    const subCategoryId = document.getElementById("entry-subcategory").value || null;
    const amount = parseFloat(document.getElementById("entry-amount").value);
    const movementType = document.getElementById("movement-type-select").value;
    const description = document.getElementById("entry-description").value.trim();
    const date = document.getElementById("entry-date").value;

    console.log("add entry");  // <-- use console.log instead of print
    
    if (!ownerId || !accountId || !categoryId || !amount || !movementType || !description || !date) {
        alert("All entry fields except SubCategory are required");
        return;
    }

    try {
        // Pass owner name, not id
        const ownerObj = owners.find(o => o.id == ownerId);
        if (!ownerObj) { alert("Invalid owner"); return; }

        const destinationAccountId = document.getElementById("entry-destination-account").value || null;


        await fetchJson("/entries", "POST", {
            owner: ownerObj.name,
            account_id: accountId,
            destination_account_id: destinationAccountId,
            category_id: categoryId,
            sub_category_id: subCategoryId,
            amount,
            movement_type: movementType,
            description,
            date
        });
        alert("Entry added");

        // Clear form
        document.getElementById("entry-amount").value = "";
        document.getElementById("entry-description").value = "";
        document.getElementById("entry-date").value = "";
        document.getElementById("entry-subcategory").value = "";

        await loadEntries();
    } catch (err) {
        alert("Failed to add entry: " + err.message);
    }
});

// Load entries (all or filtered)
async function loadEntries(filters = {}) {
    try {
        let url = "/entries/filter";
        if (Object.keys(filters).length === 0) {
            url = "/entries";  // all entries
        } else {
            url = "/entries/filter";
        }

        let body = null;
        if (url === "/entries/filter") {
            body = {
                owners: filters.owners || [],
                accounts: filters.accounts || [],
                movement_types: filters.movement_types || [],
                categories: filters.categories || [],
                date_from: filters.date_from || null,
                date_to: filters.date_to || null
            };
        }

        const entries = await fetchJson(url, body ? "POST" : "GET", body);

        const tbody = document.getElementById("entries-tbody");
        tbody.innerHTML = "";

        for (const e of entries) {
            const tr = document.createElement("tr");

            const destinationCell =
            e.movement_type === "transfer" && e.destination_account
                ? `→ ${e.destination_account.name}`
                : "";

            tr.innerHTML = `
                <td>${e.id}</td>
                <td>${e.owner.name}</td>
                <td>${e.account.name}</td>
                <td>${destinationCell}</td>
                <td>${e.account.account_type}</td>
                <td>${e.category.name}</td>
                <td>${e.subcategory ? e.subcategory.name : ""}</td>
                <td>${e.amount.toFixed(2)}</td>
                <td>${e.movement_type}</td>
                <td>${e.description}</td>
                <td>${e.date}</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (err) {
        alert("Failed to load entries: " + err.message);
    }
}

// Filter entries button
document.getElementById("filter-entries-button").addEventListener("click", async () => {
    const selectedOwners = Array.from(document.getElementById("filter-owners").selectedOptions).map(o => parseInt(o.value));
    const selectedAccounts = Array.from(document.getElementById("filter-accounts").selectedOptions).map(o => parseInt(o.value));
    const selectedMovementTypes = Array.from(document.getElementById("filter-movement-types").selectedOptions).map(o => o.value);
    const selectedCategories = Array.from(document.getElementById("filter-categories").selectedOptions).map(o => parseInt(o.value));
    const dateFrom = document.getElementById("filter-date-from").value || null;
    const dateTo = document.getElementById("filter-date-to").value || null;

    await loadEntries({
        owners: selectedOwners,
        accounts: selectedAccounts,
        movement_types: selectedMovementTypes,
        categories: selectedCategories,
        date_from: dateFrom,
        date_to: dateTo
    });
});

// Get all entries button
document.getElementById("get-all-entries-button").addEventListener("click", async () => {
    await loadEntries();
});

// On page load, try to load dropdowns if logged in
(async () => {
    try {
        // Try get current user (if endpoint exists)
        const res = await fetch("/owners");
        if (res.ok) {
            document.getElementById("login-section").style.display = "none";
            document.getElementById("add-data-section").style.display = "block";
            document.getElementById("filter-entries-section").style.display = "block";
            document.getElementById("entries-section").style.display = "block";
            document.getElementById("logout-button").style.display = "inline-block";
            await loadDropdowns();
            await loadEntries();
        }
    } catch {}
})();
