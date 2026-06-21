// ==========================================
// EMERALDOS STORAGE
// ==========================================

function getOSAccount() {

    return localStorage.getItem(
        "osAccountId"
    );
}

// ==========================================
// FILES
// ==========================================

function saveOSFile(
    filename,
    content
) {

    const account =
        getOSAccount();

    if (!account) return;

    const key =
        "os_files_" + account;

    let files =
        JSON.parse(
            localStorage.getItem(key)
            || "{}"
        );

    files[filename] =
        content;

    localStorage.setItem(
        key,
        JSON.stringify(files)
    );
}

function loadOSFile(
    filename
) {

    const account =
        getOSAccount();

    if (!account) return "";

    const key =
        "os_files_" + account;

    const files =
        JSON.parse(
            localStorage.getItem(key)
            || "{}"
        );

    return files[filename] || "";
}

function deleteOSFile(
    filename
) {

    const account =
        getOSAccount();

    if (!account) return;

    const key =
        "os_files_" + account;

    let files =
        JSON.parse(
            localStorage.getItem(key)
            || "{}"
        );

    delete files[filename];

    localStorage.setItem(
        key,
        JSON.stringify(files)
    );
}

function getOSFiles() {

    const account =
        getOSAccount();

    if (!account) return [];

    const key =
        "os_files_" + account;

    const files =
        JSON.parse(
            localStorage.getItem(key)
            || "{}"
        );

    return Object.keys(files);
}

// ==========================================
// INSTALLED APPS
// ==========================================

function saveInstalledApps(
    apps
) {

    const account =
        getOSAccount();

    if (!account) return;

    localStorage.setItem(
        "os_apps_" + account,
        JSON.stringify(apps)
    );
}

function loadInstalledApps() {

    const account =
        getOSAccount();

    if (!account) return [];

    return JSON.parse(
        localStorage.getItem(
            "os_apps_" + account
        ) || "[]"
    );
}

// ==========================================
// SETTINGS
// ==========================================

function saveSetting(
    key,
    value
) {

    const account =
        getOSAccount();

    if (!account) return;

    let settings =
        JSON.parse(
            localStorage.getItem(
                "os_settings_" + account
            ) || "{}"
        );

    settings[key] = value;

    localStorage.setItem(
        "os_settings_" + account,
        JSON.stringify(settings)
    );
}

function loadSetting(
    key,
    fallback = null
) {

    const account =
        getOSAccount();

    if (!account) return fallback;

    const settings =
        JSON.parse(
            localStorage.getItem(
                "os_settings_" + account
            ) || "{}"
        );

    return settings[key] ?? fallback;
}
