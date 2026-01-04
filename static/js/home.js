document.addEventListener("DOMContentLoaded", () => {
  const tabContent = document.getElementById("tab-content");

  document.getElementById("tabs").addEventListener("click", async (event) => {
    if (event.target.tagName === "BUTTON") {
      const tab = event.target.getAttribute("data-tab");
      try {
        const response = await fetch(`/tabs/${tab}`);
        if (!response.ok) throw new Error("Failed to load tab content");
        const html = await response.text();
        tabContent.innerHTML = html;
        
        if (tab === "accounts") {
            loadAccountSelects();
        }

        // Update active tab style
        document.querySelectorAll("#tabs button").forEach(btn => btn.classList.remove("active"));
        event.target.classList.add("active");
      } catch (err) {
        tabContent.innerHTML = `<p>Error loading content: ${err.message}</p>`;
      }
    }
  });

  // Optionally trigger first tab on load
  document.querySelector('#tabs button[data-tab="owners"]').click();
});

// logout
document.getElementById("logout").addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login";
});

async function loadAccountSelects() {
    const owner_res = await fetch("/owners");
    const owners = await owner_res.json();

    const ownerSelect = document.getElementById("account-owner-select");
    fillSelect(ownerSelect, owners, "id", "name");
    const editOwnerSelect = document.getElementById("edit-account-owner-select");
    fillSelect(editOwnerSelect, owners, "id", "name");
    
    const account_types_res = await fetch("/account/types");
    const account_types = await account_types_res.json();

    const accountTypesSelect = document.getElementById("account-type-select");
    fillSelect(accountTypesSelect, account_types, "id", "name", true, true);
    const editAccountTypesSelect = document.getElementById("edit-account-type-select");
    fillSelect(editAccountTypesSelect, account_types, "id", "name", true, true);
} 