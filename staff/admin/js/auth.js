export function getStaff() {
  return {
    session: localStorage.getItem("staffSession") === "true",
    id: localStorage.getItem("staffId"),
    name: localStorage.getItem("staffName"),
    role: localStorage.getItem("staffRole"),
    permissions: JSON.parse(
      localStorage.getItem("staffPermissions") || "{}"
    )
  };
}

export function requireAdmin() {
  const staff = getStaff();

  if (!staff.session) {
    location.href = "../login.html";
    throw new Error("No staff session");
  }

  if (staff.role !== "admin") {
    alert("Admin access required.");
    location.href = "../portal.html";
    throw new Error("Not admin");
  }

  return staff;
}
