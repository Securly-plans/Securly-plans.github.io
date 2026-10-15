const apps = {};

export function registerApp(id, app) {
    apps[id] = app;
}

export function getApp(id) {
    return apps[id];
}

export function getApps() {
    return apps;
}
