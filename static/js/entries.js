let movement_types = [];

async function initEntriesFields(tabname = "entries") {
    const response = await fetch('/movement_types');
    if (!response.ok) throw new Error('Failed to movement types');
    movement_types = await response.json();
    
    if(tabname === "entries"){
        const addEntryMovementType = document.getElementById("add-entry-movement-type");
        fillSelect(addEntryMovementType, movement_types, "id", "name", "Select Movement Type", true);

        const addEntryDate = document.getElementById("add-entry-date");
        const filterEntryDateFrom = document.getElementById("filter-entries-date-from");
        const filterEntryDateTo = document.getElementById("filter-entries-date-to");
        const today = new Date().toISOString().split("T")[0];
        addEntryDate.value = today;
        filterEntryDateFrom.value = today;
        filterEntryDateTo.value = today;
        
        const editEntryMovementType = document.getElementById("edit-entry-movement-type");
        fillSelect(editEntryMovementType, movement_types, "id", "name", "Select Movement Type", true);

        const filterEntryMovementType = document.getElementById("filter-entries-movement-type");
        fillSelect(filterEntryMovementType, movement_types, "id", "name", "Select Movement Type", true);

        loadEntries();
    }
}

document.addEventListener("click", async e => {
    if (e.target.id === "add-entry-button") {
        const account = document.getElementById("add-entry-account-select");
        if(account.value.trim() === "") {
            alert("Account cannot be empty");
            return;
        }
        const movementType = document.getElementById("add-entry-movement-type");
        if(movementType.selectedIndex === -1 || movementType.value.trim() === "") {
            alert("Movement type cannot be empty");
            return;
        }  
        const category = document.getElementById("add-entry-category-select");
        if(category.value.trim() === "") {
            alert("Category cannot be empty");
            return;
        }

        const amount = document.getElementById("add-entry-amount");
        if(amount.value.trim() === "" || isNaN(amount.value) || Number(amount.value) <= 0) {
            alert("Amount must be a positive number");
            return;
        }

        const date = document.getElementById("add-entry-date");
        if(date.value.trim() === "") {
            alert("Date cannot be empty");
            return;
        }
        
        const payload = {
          account_id: document.getElementById("add-entry-account-select").value,
          destination_account_id:
            document.getElementById("add-entry-movement-type").value === "TRANSFER"
              ? document.getElementById("add-entry-destination-account-select").value
              : null,
          movement_type_index: document.getElementById("add-entry-movement-type").selectedIndex -1, // Send index of movement type
          category_id: document.getElementById("add-entry-category-select").value,
          sub_category_id: document.getElementById("add-entry-subcategory-select").value || null,
          amount: document.getElementById("add-entry-amount").value,
          date: document.getElementById("add-entry-date").value,
          description: document.getElementById("add-entry-description").value
        };

        console.log("Add Entry Payload:", payload);

        try {
            await fetch("/entries/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
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
                loadEntries();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-entry-button") {
        const entryId = document.getElementById("remove-entry-select").value;
        if(entryId.trim() === "") {
            alert("Entry ID cannot be empty");
            return;
        }
        try {
            await fetch(`/entries/remove/${entryId}`, {
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
                loadEntries();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Remove owner failed: " + err.message);
        }
    }

    if (e.target.id === "edit-entry-button") {
        const entryId = document.getElementById("edit-entry-select").value;

        const destination_account = document.getElementById("edit-entry-destination-account");
        const payload = {
            amount: parseFloat(document.getElementById("edit-entry-amount").value),
            description: document.getElementById("edit-entry-description").value,
            date: document.getElementById("edit-entry-date").value,
            category_id: document.getElementById("edit-entry-category-select").value,
            sub_category_id: document.getElementById("edit-entry-subcategory-select").value || null,
            movement_type_index: document.getElementById("edit-entry-movement-type").selectedIndex -1, // Send index of movement type
            destination_account_id:  destination_account ? destination_account.value : null
        };

        try {
             await fetch(`/entries/edit/${entryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                loadEntries();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Edit entry failed: " + err.message);
        }
    }   
    
    if (e.target.id === "filter-entries-search-button") {
        filterEntries();
    }

    if (e.target.id === "filter-entries-reset-button") {
        document.querySelectorAll(
            "#filter-entries-movement-type, #filter-entries-account-select, #filter-entries-destination-account-select, " +
            "#filter-entries-category-select, #filter-entries-subcategory-select"
        ).forEach(el => el.value = "");

        document.querySelectorAll(
            "#filter-entries-amount-min, #filter-entries-amount-max, " +
            "#filter-entries-date-from, #filter-entries-date-to, #filter-entries-description"
        ).forEach(el => el.value = "");

        loadEntries();
    }
});


async function addEntry() {
  const payload = {
    owner_id: document.getElementById("add- entry-owner-select")?.value,
    account_id: document.getElementById("add-entry-account-select").value,
    destination_account_id:
      document.getElementById("add-entry-movement-type").value === "TRANSFER"
        ? document.getElementById("add-entry-destination-account-select").value
        : null,
    movement_type: document.getElementById("add-entry-movement-type").value,
    category_id: document.getElementById("add-entry-category-select").value,
    sub_category_id: document.getElementById("add-entry-subcategory-select").value || null,
    amount: document.getElementById("add-entry-amount").value,
    date: document.getElementById("add-entry-date").value,
    description: document.getElementById("add-entry-description").value
  };

  const res = await fetch("/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  loadEntries();
}

async function loadEntries(entriesData = null) {
  let entries = [];
  if(!entriesData){
    payload = {}; 
    const res = await fetch("/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload )
    });
    entries = await res.json();
  }else{
    entries = entriesData;
  }

  const tbody = document.getElementById("entries-tbody");
  tbody.innerHTML = "";

  const editSelect = document.getElementById("edit-entry-select");
  editSelect.innerHTML = "";

  const opt_e0 = document.createElement("option");
  opt_e0.value = -1;
  opt_e0.textContent = `Select Entry Id`;
  editSelect.appendChild(opt_e0);
  
  const removeSelect = document.getElementById("remove-entry-select");
  removeSelect.innerHTML = "";

  const opt_r0 = document.createElement("option");
  opt_r0.value = -1;
  opt_r0.textContent = `Select Entry Id`;
  removeSelect.appendChild(opt_r0);

  for (const e of entries.items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.movement_type}</td>
      <td>${e.account.name}</td>
      <td>${e.destination_account?.name || "-"}</td>
      <td>${e.category.name}</td>
      <td>${e.subcategory?.name || "-"}</td>
      <td>${e.amount}</td>
      <td>${e.description}</td>
      <td>${e.date}</td>
    `;
    tbody.appendChild(tr);

    const opt_e = document.createElement("option");
    opt_e.value = e.id;
    opt_e.textContent = `#${e.id}`;
    editSelect.appendChild(opt_e);
    
    const opt_r = document.createElement("option");
    opt_r.value = e.id;
    opt_r.textContent = `#${e.id}`;
    removeSelect.appendChild(opt_r);
  }
}

async function editEntry() {
  const entryId = document.getElementById("edit-entry-select").value;

  const payload = {
    amount: document.getElementById("edit-entry-amount").value,
    description: document.getElementById("edit-entry-description").value
  };

  const res = await fetch(`/entries/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  loadEntries();
}

async function filterEntries() {
  const payload = {};

  const movementType = document.getElementById("filter-entries-movement-type").value;
  if (movementType) payload.movement_types = [movementType];

  const accountId = document.getElementById("filter-entries-account-select").value;
  if (accountId) payload.account_ids = [Number(accountId)];

  const categoryId = document.getElementById("filter-entries-category-select").value;
  if (categoryId) payload.category_ids = [Number(categoryId)];

  const subCategoryId = document.getElementById("filter-entries-subcategory-select").value;
  if (subCategoryId) payload.sub_category_ids = [Number(subCategoryId)];

  // ---- amount range ----
  const minAmount = document.getElementById("filter-entries-amount-min").value;
  const maxAmount = document.getElementById("filter-entries-amount-max").value;

  if (minAmount || maxAmount) {
    payload.amount = {};
    if (minAmount) payload.amount.min = Number(minAmount);
    if (maxAmount) payload.amount.max = Number(maxAmount);
  }

  // ---- date range ----
  const dateFrom = document.getElementById("filter-entries-date-from").value;
  const dateTo = document.getElementById("filter-entries-date-to").value;

  if (dateFrom || dateTo) {
    payload.date = {};
    if (dateFrom) payload.date.from = dateFrom;
    if (dateTo) payload.date.to = dateTo;
  }

  // ---- description ----
  const description = document.getElementById("filter-entries-description").value.trim();
  if (description) payload.description = description;

  const res = await fetch("/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Search failed");
    return;
  }

  loadEntries(data);
}