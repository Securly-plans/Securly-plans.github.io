/* =========================================================
   EMERALDOS 5.7 - PERMISSIONS
   Lightweight permission system for built-in and user apps.
========================================================= */
const ROLE_PERMISSIONS = {
    user: [
        "files.read", "files.write",
        "mail.read", "mail.write",
        "notifications.send",
        "apps.install",
        "apps.create", "apps.preview"
    ],
    virtue: [
        "files.read", "files.write",
        "mail.read", "mail.write",
        "notifications.send",
        "apps.install", "apps.create", "apps.preview", "apps.publish",
        "system.customize"
    ],
    admin: ["*"]
};

export function getUserRole() {
    const storedRole = localStorage.getItem("emeraldos_57_role");
    if (storedRole) return storedRole;
    if (localStorage.getItem("role") === "admin") return "admin";
    if ((localStorage.getItem("role") || "").toLowerCase() === "vip") return "virtue";
    return "virtue";
}

export function hasPermission(permission) {
    const role = getUserRole();
    const granted = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
    return granted.includes("*") || granted.includes(permission);
}

export function requirePermission(permission) {
    if (!hasPermission(permission)) {
        throw new Error(`Permission denied: ${permission}`);
    }
    return true;
}

export function describePermissions(permissions = []) {
    if (!permissions.length) return "No special permissions requested.";
    return permissions.join(", ");
}
