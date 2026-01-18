// Globals for cached data
let owners = [];

async function initOwnersFields(tabname = "owners") {
    const owner_res = await fetch("/owners");
    if (!owner_res.ok) throw new Error('Failed to fetch owners');
    owners = await owner_res.json();
    
    if(tabname === "accounts"){
        const ownerSelect = document.getElementById("account-owner-select");
        fillSelect(ownerSelect, owners, "id", "name", "Select owner");
        const editOwnerSelect = document.getElementById("edit-account-owner-select");
        fillSelect(editOwnerSelect, owners, "id", "name", "Select owner");
    }

    if(tabname === "owners"){
        const infoOwnerSelect = document.getElementById("info-owner-select");
        fillSelect(infoOwnerSelect, owners, "id", "name", "Select owner");
        const removeOwnerSelect = document.getElementById("remove-owner-select");
        fillSelect(removeOwnerSelect, owners, "id", "name", "Select owner");
        const editOwnerSelect = document.getElementById("edit-owner-select");
        fillSelect(editOwnerSelect, owners, "id", "name", "Select owner");

        populateOwnersTable(owners);
    }
}

function populateOwnersTable(owners) {

  const tbody = document.getElementById('owners-tbody');
  tbody.innerHTML = ''; // clear existing rows

  for (const e of owners) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${e.id}</td>
        <td>${e.name}</td>
    `;
    tbody.appendChild(tr);
}
}

document.addEventListener("click", async e => {
    if (e.target.id === "add-owner") {
        const name = document.getElementById("owner-name").value;
        if(name.trim() === "") {
            alert("Owner name cannot be empty");
            return;
        }

        try {
            await fetch("/owners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name: name })
            }).then(async response => {
                const data = await response.json();
                if (!response.ok){
                    if(data?.error)
                        throw new Error(`${data?.error}`);    
                    else
                        throw new Error(`HTTP error! Status: ${response.status}`);
                }

                return data;
            })
            .then(data => {
                initOwnersFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add owner failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-owner") {
        const ownerId = document.getElementById("remove-owner-select").value;
        if(ownerId.trim() === "") {
            alert("Owner ID cannot be empty");
            return;
        }
        try {
            await fetch(`/owners/remove/${ownerId}`, {
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
                initOwnersFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Remove owner failed: " + err.message);
        }
    }

    if (e.target.id === "info-owner") {
        const ownerId = document.getElementById("info-owner-select").value;
        
        if(ownerId.trim() === "") {
            alert("Owner ID cannot be empty");
            return;
        }
        try {
            await fetch(`/owners/info/${ownerId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }).then(async response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }else{
                    const json = await response.json();
                    const info_tbody = document.getElementById('info-owners-tbody');
                    info_tbody.innerHTML = ''; // clear existing rows
    
                    const tr = document.createElement("tr");

                    tr.innerHTML = `
                        <td>${json.owner_id}</td>
                        <td>${json.owner_name}</td>
                        <td>${json.accounts_count}</td>
                        <td>${json.entries_count}</td>
                    `;
                    info_tbody.appendChild(tr);
                }
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Info owner failed: " + err.message);
        }
    }
    
    if (e.target.id === "edit-owner") {
        const ownerId = document.getElementById("edit-owner-select").value;
        const ownerName = document.getElementById("owner-edit-name").value;

        if(ownerId.trim() === "" || ownerName.trim() === "") {
            alert("Owner ID and name cannot be empty");
            return;
        }
        try {
            await fetch(`/owners/edit/${ownerId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: ownerName })
            }).then(response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                initOwnersFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }

    if (e.target.id === "get-owner") {
        initOwnersFields();
    }
});
