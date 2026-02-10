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