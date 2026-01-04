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
