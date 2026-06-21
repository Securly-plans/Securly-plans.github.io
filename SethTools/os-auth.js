// ==========================================
// EMERALDOS AUTHENTICATION
// ==========================================

(function () {

    // User must be signed into the main site.

    if (
        localStorage.getItem("loggedIn") !== "true"
    ) {
        location.href = "../index.html";
    }

})();

// ==========================================
// HASH PASSWORD
// ==========================================

async function hashPassword(password) {

    const data =
        new TextEncoder().encode(password);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
    .map(b =>
        b.toString(16).padStart(2, "0")
    )
    .join("");
}

// ==========================================
// REGISTER OS ACCOUNT
// ==========================================

async function registerOS() {

    const username =
        document.getElementById(
            "os-user"
        ).value.trim();

    const password =
        document.getElementById(
            "os-pass"
        ).value;

    const confirm =
        document.getElementById(
            "os-pass2"
        ).value;

    if (!username) {
        alert("Enter a username.");
        return;
    }

    if (password.length < 4) {
        alert(
            "Password must be at least 4 characters."
        );
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    const siteUserId =
        localStorage.getItem("userId");

    const accounts =
        JSON.parse(
            localStorage.getItem(
                "os_accounts"
            ) || "[]"
        );

    const existingLink =
        accounts.find(
            a =>
                a.linkedUserId ===
                siteUserId
        );

    if (existingLink) {
        alert(
            "This account already has an EmeraldOS account."
        );
        return;
    }

    const existingName =
        accounts.find(
            a =>
                a.osUsername
                    .toLowerCase() ===
                username.toLowerCase()
        );

    if (existingName) {
        alert(
            "Username already exists."
        );
        return;
    }

    const passwordHash =
        await hashPassword(password);

    const account = {

        id:
            "os_" +
            Date.now(),

        osUsername:
            username,

        passwordHash,

        linkedUserId:
            siteUserId,

        created:
            Date.now()
    };

    accounts.push(account);

    localStorage.setItem(
        "os_accounts",
        JSON.stringify(accounts)
    );

    alert(
        "EmeraldOS account created."
    );

    location.href = "index.html";
}

// ==========================================
// LOGIN
// ==========================================

async function loginOS() {

    const username =
        document.getElementById(
            "os-user"
        ).value.trim();

    const password =
        document.getElementById(
            "os-pass"
        ).value;

    const passwordHash =
        await hashPassword(password);

    const accounts =
        JSON.parse(
            localStorage.getItem(
                "os_accounts"
            ) || "[]"
        );

    const account =
        accounts.find(
            a =>
                a.osUsername
                    .toLowerCase() ===
                username.toLowerCase()
        );

    if (!account) {
        alert(
            "Account not found."
        );
        return;
    }

    const siteUserId =
        localStorage.getItem(
            "userId"
        );

    if (
        account.linkedUserId !==
        siteUserId
    ) {
        alert(
            "This EmeraldOS account belongs to another site account."
        );
        return;
    }

    if (
        account.passwordHash !==
        passwordHash
    ) {
        alert(
            "Incorrect password."
        );
        return;
    }

    localStorage.setItem(
        "osLoggedIn",
        "true"
    );

    localStorage.setItem(
        "osUsername",
        account.osUsername
    );

    localStorage.setItem(
        "osAccountId",
        account.id
    );

    location.href = "OS.html";
}

// ==========================================
// LOGOUT
// ==========================================

function logoutOS() {

    localStorage.removeItem(
        "osLoggedIn"
    );

    localStorage.removeItem(
        "osUsername"
    );

    localStorage.removeItem(
        "osAccountId"
    );

    location.href = "index.html";
}
