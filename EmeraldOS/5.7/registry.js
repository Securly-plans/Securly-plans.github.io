/* =========================================================
   EMERALDOS 5.7 - REGISTRY
   Stores app metadata and user-facing settings.
========================================================= */
export const VERSION = "5.7";

export const DEFAULT_SETTINGS = {
    theme: "classic",
    wallpaper: "emerald-grid",
    iconSize: "medium",
    startupApps: [],
    currentUser: "Wmonroe01",
    developerMode: true,
    virtueMode: true
};

export const SYSTEM_APPS = [
    {
        id: "emerald-mail",
        name: "Emerald Mail",
        category: "Communication",
        description: "User-to-user EmeraldOS mail with inbox, sent, drafts, and trash.",
        icon: "assets/logos/emerald-mail.png",
        permissions: ["mail.read", "mail.write", "notifications.send"]
    },
    {
        id: "emerald-office",
        name: "Emerald Office",
        category: "Office",
        description: "Launcher for Docs, Sheets, and Slides.",
        icon: "assets/logos/emerald-office.png",
        permissions: ["files.read", "files.write"]
    },
    {
        id: "emerald-docs",
        name: "Emerald Docs",
        category: "Office",
        description: "Word processor for .doc-style EmeraldOS documents.",
        icon: "assets/logos/emerald-docs.png",
        permissions: ["files.read", "files.write"]
    },
    {
        id: "emerald-sheets",
        name: "Emerald Sheets",
        category: "Office",
        description: "Spreadsheet editor with local file storage.",
        icon: "assets/logos/emerald-sheets.png",
        permissions: ["files.read", "files.write"]
    },
    {
        id: "emerald-slides",
        name: "Emerald Slides",
        category: "Office",
        description: "Presentation editor with Win95-style slide tools.",
        icon: "assets/logos/emerald-slides.png",
        permissions: ["files.read", "files.write"]
    },
    {
        id: "app-editor",
        name: "App Editor",
        category: "Developer",
        description: "Create HTML, CSS, and JavaScript apps directly inside EmeraldOS.",
        icon: "assets/logos/app-editor.png",
        permissions: ["apps.create", "apps.preview", "files.write"]
    },
    {
        id: "user-appstore",
        name: "User Appstore",
        category: "Developer",
        description: "Install, remove, and publish user-created apps.",
        icon: "assets/logos/user-appstore.png",
        permissions: ["apps.install", "apps.publish"]
    },
    {
        id: "virtue-creator",
        name: "Virtue Creator",
        category: "Developer",
        description: "Advanced creator tools for Virtue users.",
        icon: "assets/logos/virtue-creator.png",
        permissions: ["apps.create", "apps.publish", "system.customize"]
    },
    {
        id: "system-customizer",
        name: "System Customizer",
        category: "System",
        description: "Theme, wallpaper, startup, and desktop customization.",
        icon: "assets/logos/system-customizer.png",
        permissions: ["system.customize"]
    }
];

export function getApp(id) {
    return SYSTEM_APPS.find(app => app.id === id) || null;
}
