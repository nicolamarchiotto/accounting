let movement_types = [];
let movement_type_transfer = "";
let movement_type_expense = "";
let accounts = [];
let account_types = [];
let categories = [];
let owners = [];

document.addEventListener("DOMContentLoaded", async () => {
  const tabContent = document.getElementById("tab-content");

  response = await fetch('/movement_types');
  if (!response.ok) throw new Error('Failed to movement types');
  movement_types = await response.json();
  movement_type_transfer = movement_types[2];
  movement_type_expense = movement_types[0];

  response = await fetch("/account/types");
  if(!response.ok) throw new Error('Failed to fetch account types');
  account_types = await response.json();

  updateCachedAccounts()
  updateCachedCategories()
  updateCachedOwners()

  document.getElementById("tabs").addEventListener("click", async (event) => {
    if (event.target.tagName === "BUTTON") {
      const tab = event.target.getAttribute("data-tab");
      try {
        let response = await fetch(`/tabs/${tab}`);
        if (!response.ok) throw new Error("Failed to load tab content");
        const html = await response.text();
        tabContent.innerHTML = html;
    
        initOwnersFields(tab);
        initAccountsFields(tab);
        initCategoriesFields(tab);
        initEntriesFields(tab)

        // Update active tab style
        document.querySelectorAll("#tabs button").forEach(btn => btn.classList.remove("active"));
        event.target.classList.add("active");
      } catch (err) {
        tabContent.innerHTML = `<p>Error loading content: ${err.message}</p>`;
      }
    }
  });

  // Optionally trigger first tab on load
  document.querySelector('#tabs button[data-tab="entries"]').click();
});

// logout
document.getElementById("logout").addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login"; 
});

async function updateCachedAccounts() {
  const response = await fetch('/accounts');
  if (!response.ok) throw new Error('Failed to fetch accounts');
  accounts = await response.json();
}

async function updateCachedCategories() {
  const response = await fetch("/categories");
  if (!response.ok) throw new Error('Failed to fetch categories');
  categories = await response.json();
}

async function updateCachedOwners() {  
  const response = await fetch("/owners");
  if (!response.ok) throw new Error('Failed to fetch owners');
  owners = await response.json();
}

function onEditCategorySubcategoryChange(categorySelectId, subcategorySelectId) {
    const categorySelect = document.getElementById(categorySelectId);
    const subcategorySelect = document.getElementById(subcategorySelectId);

    if (!categorySelect || !subcategorySelect) 
      return;
    
    subcategorySelect.innerHTML = "";
    const categoryId = categorySelect.value;
    
    const category = categories.find(c => c.id == categoryId);
    if (!category) 
      return;

    fillSelect(subcategorySelect, category.subcategories, "id", "name", "Select subcategory");
}