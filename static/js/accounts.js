let accounts = [];
let accountTypes = [];

async function fetchAccounts() {
  try {
    const response = await fetch('/accounts');
    if (!response.ok) throw new Error('Failed to fetch accounts');
    accounts = await response.json();
    populateAccountsTable(accounts);
  } catch (error) {
    alert(error.message);
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

async function loadOwnersSelect() {
    const res = await fetch("/owners");
    const owners = await res.json();

    const ownerSelect = document.getElementById("account-owner-select");
    fillSelect(ownerSelect, owners, "id", "name");
}

document.addEventListener("DOMContentLoaded", () => {
    loadOwnersSelect();
});

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
            }).then(response => {
                if (!response.ok){
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                fetchAccounts();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-account") {
        const accountId = document.getElementById("account-id").value;
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
                fetchAccounts();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "edit-account") {
        const accountId = document.getElementById("account-edit-id").value;
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
                fetchAccounts();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }

    if (e.target.id === "get-account") {
        fetchAccounts();
    }
});