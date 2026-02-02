let accounts = [];
let account_types = [];

async function initAccountsFields(tabname = "accounts") {
    const response = await fetch('/accounts');
    if (!response.ok) throw new Error('Failed to fetch accounts');
    accounts = await response.json();
    
    if(tabname === "accounts"){
        populateAccountsTable(accounts);

        const removeAccountSelect = document.getElementById("remove-account-select");
        fillSelect(removeAccountSelect, accounts, "id", "name", "Select account");

        const editAccountSelect = document.getElementById("edit-account-select");
        fillSelect(editAccountSelect, accounts, "id", "name", "Select account");

        const account_types_res = await fetch("/account/types");
        if(!account_types_res.ok) throw new Error('Failed to fetch account types');
        account_types = await account_types_res.json();

        const accountTypeSelect = document.getElementById("account-type-select");
        fillSelect(accountTypeSelect, account_types, "type", "type", "Select account type", true);
        const editAccountTypeSelect = document.getElementById("edit-account-type-select");
        fillSelect(editAccountTypeSelect, account_types, "type", "type", "Select account type", true);
    }

    if(tabname === "entries"){
        const addEntryAccountSelect = document.getElementById("add-entry-account-select");
        const addEntryDestinationAccountSelect = document.getElementById("add-entry-destination-account-select");
        fillSelect(addEntryAccountSelect, accounts, "id", "name", "Select account");
        
        addEntryAccountSelect.addEventListener("change", ()=>{
            if(addEntryDestinationAccountSelect){
                const destinationAccounts = accounts.filter(a => a.id != addEntryAccountSelect.value);
                fillSelect(addEntryDestinationAccountSelect, destinationAccounts, "id", "name", "Select Destination account");
            }
        });
        
        const addEntryMovementType = document.getElementById("add-entry-movement-type");
        addEntryMovementType.addEventListener("change", ()=>{
            if(addEntryDestinationAccountSelect){
                const destinationAccounts = accounts.filter(a => a.id != addEntryAccountSelect.value);
                fillSelect(addEntryDestinationAccountSelect, destinationAccounts, "id", "name", "Select Destination account", false, true);
                
                if(addEntryMovementType){
                    const movementType = addEntryMovementType.value;
                    addEntryDestinationAccountSelect.style.display = movementType === "Transfer" && accounts.length > 1 ? "inline" : "none";
                }
            }
        });

        const addEntryOwnerInput = document.getElementById("add-entry-owner-input");
        addEntryAccountSelect.addEventListener("change", () =>{
            const accountId = addEntryAccountSelect.value;    
            if (!accountId) return;
            const account = accounts.find(a => a.id == accountId);
            if (!account) return;
            addEntryOwnerInput.value = account.owner;
        });

        const editEntryAccountSelect = document.getElementById("edit-entry-account-select");
        fillSelect(editEntryAccountSelect, accounts, "id", "name", "Select account");
        const editEntryOwnerInput = document.getElementById("edit-entry-owner-input");
        editEntryAccountSelect.addEventListener("change", () =>{
            const accountId = editEntryAccountSelect.value;    
            if (!accountId) return;
            console.log("Selected account ID:", accountId);
            const account = accounts.find(a => a.id == accountId);
            if (!account) return;
            console.log("Found account:", account);
            editEntryOwnerInput.value = account.owner;
        });

        const filterEntryAccountSelect = document.getElementById("filter-entries-account-select");
        fillSelect(filterEntryAccountSelect, accounts, "id", "name", "Select account");
    }
}

function populateAccountsTable(accounts) {

  const tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = ''; // clear existing rows

  for (const e of accounts) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${e.id}</td>
        <td>${e.name}</td>
        <td>${e.owner}</td>
        <td>${e.account_type}</td>
    `;
    tbody.appendChild(tr);
}
}

document.addEventListener("click", async e => {
    if (e.target.id === "add-account") {
        const name = document.getElementById("account-name").value;
        const accountType = document.getElementById("account-type-select").value;
        const acconuntOwner = document.getElementById("account-owner-select").value;
               
        if(name.trim() === "" || accountType.trim() === "" || acconuntOwner.trim() === "") {
            alert("Account name, type, and owner cannot be empty");
            return;
        }

        try {
            await fetch("/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name: name, account_type: accountType, owner_id: acconuntOwner})
            }).then(async response => {
                const data = await response.json(); // ALWAYS parse JSON
                if (!response.ok){
                    if(data?.error)
                        throw new Error(`${data?.error}`);    
                    else
                        throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return data; // Parse JSON if response is OK
            })
            .then(data => {
                initAccountsFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-account") {
        const accountId = document.getElementById("remove-account-select").value;
        if(accountId.trim() === "") {
            alert("Account ID cannot be empty");
            return;
        }
        try {
            await fetch(`/accounts/remove/${accountId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            }).then(response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                initAccountsFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "edit-account") {
        const accountId = document.getElementById("edit-account-select").value;
        const accountName = document.getElementById("account-edit-name").value;
        const accountType = document.getElementById("edit-account-type-select").value;
        const accountOwner = document.getElementById("edit-account-owner-select").value;
               
        if(accountId.trim() === "" || accountName.trim() === "" || accountType.trim() === "" || accountOwner.trim() === "") {
            alert("account ID, name, type, and owner cannot be empty");
            return;
        }
        try {
            await fetch(`/accounts/edit/${accountId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: accountName, account_type: accountType, owner_id: accountOwner })
            }).then(response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                initAccountsFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }

    if (e.target.id === "get-account") {
        initAccountsFields();
    }
});