export function requireStaff() {
    const isStaff = localStorage.getItem("staffSession") === "true";

    if (!isStaff) {
        window.location.replace("../staff/login.html");
        return false;
    }

    return true;
}

export function getStaffRole() {
    return localStorage.getItem("staffRole");
}

export function getStaffId() {
    return localStorage.getItem("staffId");
}

export function getPermissions() {
    return JSON.parse(
        localStorage.getItem("staffPermissions") || "{}"
    );
}
