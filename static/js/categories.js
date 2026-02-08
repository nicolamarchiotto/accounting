// Globals for cached data
let categories = [];

async function initCategoriesFields(tabname = "categories") {

    const categories_res = await fetch("/categories");
    if (!categories_res.ok) throw new Error('Failed to fetch categories');
    categories = await categories_res.json();
    
    if(tabname === "categories"){
        const editCategorySelect = document.getElementById("edit-category-select");
        fillSelect(editCategorySelect, categories, "id", "name", "Select category");
        const removeCategorySelect = document.getElementById("remove-category-select");
        fillSelect(removeCategorySelect, categories, "id", "name", "Select category");
        
        const addSubcategoryCategorySelect = document.getElementById("add-subcategory-category-select");
        fillSelect(addSubcategoryCategorySelect, categories, "id", "name", "Select category");
        const editSubcategoryCategorySelect = document.getElementById("edit-subcategory-category-select");
        fillSelect(editSubcategoryCategorySelect, categories, "id", "name", "Select category");
        const removeSubcategoryCategorySelect = document.getElementById("remove-subcategory-category-select");
        fillSelect(removeSubcategoryCategorySelect, categories, "id", "name", "Select category");
        
        onEditCategorySubcategoryChange("edit-subcategory-category-select", "edit-subcategory-subcategory-select")
        onEditCategorySubcategoryChange("remove-subcategory-category-select", "remove-subcategory-subcategory-select")

        if (editSubcategoryCategorySelect) {
            editSubcategoryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("edit-subcategory-category-select", "edit-subcategory-subcategory-select")
            );
        }

        if (removeSubcategoryCategorySelect) {
            removeSubcategoryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("remove-subcategory-category-select", "remove-subcategory-subcategory-select")
            );
        }
        populateCategoriesTable(categories);
    }

    if(tabname === "entries"){
        const addEntryCategorySelect = document.getElementById("add-entry-category-select");
        fillSelect(addEntryCategorySelect, categories, "id", "name", "Select category");

        onEditCategorySubcategoryChange("add-entry-category-select", "add-entry-subcategory-select")
        
        const addEntrySubcategorySelect = document.getElementById("add-entry-subcategory-select");
        if(addEntryCategorySelect && addEntrySubcategorySelect){
            addEntryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("add-entry-category-select", "add-entry-subcategory-select")
            );
        }

        const editEntryCategorySelect = document.getElementById("edit-entry-category-select");
        fillSelect(editEntryCategorySelect, categories, "id", "name", "Select category");
        
        onEditCategorySubcategoryChange("edit-entry-category-select", "edit-entry-subcategory-select")
        
        const editEntrySubcategorySelect = document.getElementById("edit-entry-subcategory-select");
        if(editEntryCategorySelect && editEntrySubcategorySelect){
            editEntryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("edit-entry-category-select", "edit-entry-subcategory-select")
            );
        }

        const filterEntryCategorySelect = document.getElementById("filter-entries-category-select");
        fillSelect(filterEntryCategorySelect, categories, "id", "name", "Select category");
 
        const filterEntrySubcategorySelect = document.getElementById("filter-entries-subcategory-select");
        fillSelect(filterEntrySubcategorySelect, [], "id", "name", "Select subcategory");
        
        if(filterEntryCategorySelect && filterEntrySubcategorySelect){
            filterEntryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("filter-entries-category-select", "filter-entries-subcategory-select")
            );
        }

        const aggregateEntryCategorySelect = document.getElementById("aggregate-entries-category-select");
        fillSelect(aggregateEntryCategorySelect, categories, "id", "name", "Select category");
 
        const aggregateEntrySubcategorySelect = document.getElementById("aggregate-entries-subcategory-select");
        fillSelect(aggregateEntrySubcategorySelect, [], "id", "name", "Select subcategory");
        
        if(aggregateEntryCategorySelect && aggregateEntrySubcategorySelect){
            aggregateEntryCategorySelect.addEventListener("change", () =>
                onEditCategorySubcategoryChange("aggregate-entries-category-select", "aggregate-entries-subcategory-select")
            );
        }
    }
}

function populateCategoriesTable(categories) {

  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return; 
  tbody.innerHTML = ''; 

  for (const cat of categories) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${cat.id}</td>
        <td>${cat.name}</td>
        <td></td>
        <td></td>
    `;
    tbody.appendChild(tr);

    const subs = cat.subcategories || [];

    for (const sub of subs) {
        const subtr = document.createElement("tr");
        subtr.innerHTML = `
        <td>${cat.id}</td>
        <td>${cat.name}</td>
        <td>${sub.id}</td>
        <td>${sub.name}</td>
        `;
        tbody.appendChild(subtr);
    }
}
}

document.addEventListener("click", async e => {
    if (e.target.id === "add-category-button") {
        const name = document.getElementById("add-category-name").value;
        if(name.trim() === "") {
            alert("Category name cannot be empty");
            return;
        }

        try {
            await fetch("/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name: name })
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
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add owner failed: " + err.message);
        }
    }
    
    if (e.target.id === "remove-category-button") {
        const categoryId = document.getElementById("remove-category-select").value;
        if(categoryId.trim() === "") {
            alert("Category ID cannot be empty");
            return;
        }
        try {
            await fetch(`/categories/remove/${categoryId}`, {
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
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Remove owner failed: " + err.message);
        }
    }

    if (e.target.id === "edit-category-button") {
        const categoryId = document.getElementById("edit-category-select").value;
        const categoryName = document.getElementById("edit-category-name").value;

        if(categoryId.trim() === "" || categoryName.trim() === "") {
            alert("Category ID and name cannot be empty");
            return;
        }
        try {
            await fetch(`/categories/edit/${categoryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: categoryName })
            }).then(response => {
                if (!response.ok) {
                    // HTTP status is NOT in the 200-299 range
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json(); // Parse JSON if response is OK
            })
            .then(data => {
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add entry failed: " + err.message);
        }
    }

    if (e.target.id === "get-category-button") {
        initCategoriesFields();
    }

    ////// Subcategories //////

    if (e.target.id === "add-subcategory-button") {
        const categoryId = document.getElementById("add-subcategory-category-select").value;
        const name = document.getElementById("add-subcategory-name").value;
        if(name.trim() === "" || categoryId.trim() === "") {
            alert("Subcategory name and category ID cannot be empty");
            return;
        }

        try {
            await fetch("/subcategories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name: name, category_id: categoryId })
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
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add owner failed: " + err.message);
        }   
    }

    if (e.target.id === "edit-subcategory-button") {
        const subcategoryId = document.getElementById("edit-subcategory-subcategory-select").value;
        const name = document.getElementById("edit-subcategory-name").value;
        if(name.trim() === ""  || subcategoryId.trim() === "") {
            alert("Subcategory name and subcategory cannot be empty");
            return;
        }

        try {
            await fetch(`/subcategories/edit/${subcategoryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({name: name})
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
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Add owner failed: " + err.message);
        }   
    }

    if (e.target.id === "remove-subcategory-button") {
        const subcategoryId = document.getElementById("remove-subcategory-subcategory-select").value;
        if(subcategoryId.trim() === "") {
            alert("Subcategory ID cannot be empty");
            return;
        }
        try {
            await fetch(`/subcategories/remove/${subcategoryId}`, {
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
                initCategoriesFields();
            })
            .catch(err => {
                alert("Request failed: " + err.message);
            });
        } catch (err) {
            alert("Remove owner failed: " + err.message);
        }
    }
});

function onEditCategorySubcategoryChange(categorySelectId, subcategorySelectId) {
    const categoryId = document.getElementById(categorySelectId).value;
    const subcategorySelect = document.getElementById(subcategorySelectId);

    subcategorySelect.innerHTML = "";

    if (!categoryId) return;

    const category = categories.find(c => c.id == categoryId);
    if (!category) return;

    fillSelect(subcategorySelect, category.subcategories, "id", "name", "Select subcategory");
}