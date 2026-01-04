async function fetchOwners() {
  try {
    const response = await fetch('/owners');
    if (!response.ok) throw new Error('Failed to fetch owners');
    const owners = await response.json();
    populateOwnersTable(owners);
  } catch (error) {
    alert(error.message);
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
            }).then(response => {
                if (!response.ok){
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                fetchOwners();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-owner") {
        const ownerId = document.getElementById("owner-id").value;
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
                fetchOwners();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "edit-owner") {
        const ownerId = document.getElementById("owner-edit-id").value;
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
                fetchOwners();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }

    if (e.target.id === "get-owner") {
        fetchOwners();
    }
});
