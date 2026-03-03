document.getElementById("login-btn").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if(!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        });

        const data = await res.json();  // safe now

        if (data.success) {
            window.location.href = "/home";  // or your main app page
        } else {
            alert("Login failed: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        alert("Login failed: " + err.message);
    }
});

// Function to get query params from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
    if (getQueryParam("unauthorized") === "1") {
        const popup = document.getElementById("unauthorized-popup");
        popup.style.display = "block";

        // Hide popup after 3 seconds
        setTimeout(() => {
        popup.style.opacity = "0";
        setTimeout(() => {
            popup.style.display = "none";
        }, 500); // match the transition duration
        }, 3000);
    }
});