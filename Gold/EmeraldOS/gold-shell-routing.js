"use strict";

export const DEFAULT_ROUTE = Object.freeze({
  product: "EmeraldOS Gold",
  latestVersion: "1M",
  build: "1M",
  folder: "Gold_1M",
  entry: "OS.html",
  loginEntry: "index.html",
  releaseTitle: "EmeraldOS Gold 1M",
  channel: "stable"
});

export function clean(value) {
  return String(value ?? "").trim();
}

export function safeFolder(value, fallback = "") {
  const folder = clean(value);
  if (!folder || folder.includes("..") || folder.includes("/") || folder.includes("\\")) return fallback;
  return /^[A-Za-z0-9._-]+$/.test(folder) ? folder : fallback;
}

export function safeEntry(value, fallback = "index.html") {
  const entry = clean(value).replace(/^\.\//, "");
  if (!entry || entry.includes("..") || entry.startsWith("/") || /^[a-z]+:/i.test(entry)) return fallback;
  return /^[A-Za-z0-9._/-]+$/.test(entry) ? entry : fallback;
}

export function normalizeRoute(value = {}, fallback = DEFAULT_ROUTE) {
  const source = value && typeof value === "object" ? value : {};
  const base = fallback && typeof fallback === "object" ? fallback : DEFAULT_ROUTE;
  const version = clean(
    source.activeVersion ||
    source.latestVersion ||
    source.currentVersion ||
    source.version ||
    source.build ||
    base.latestVersion ||
    base.version ||
    ""
  );
  const folder = safeFolder(
    source.activeFolder ||
    source.currentFolder ||
    source.versionFolder ||
    source.folder,
    safeFolder(base.folder, DEFAULT_ROUTE.folder)
  );
  const entry = safeEntry(
    source.entry || source.osEntry || source.bootEntry || base.entry || "OS.html",
    "OS.html"
  );
  const loginEntry = safeEntry(
    source.loginEntry || source.loginPage || source.signInEntry || base.loginEntry || "index.html",
    "index.html"
  );

  return {
    product: clean(source.product || base.product || "EmeraldOS Gold"),
    latestVersion: version,
    build: clean(source.build || version),
    folder,
    entry,
    loginEntry,
    releaseTitle: clean(source.releaseTitle || source.title || base.releaseTitle || `EmeraldOS Gold ${version}`),
    channel: clean(source.channel || base.channel || "stable"),
    summary: clean(source.summary || ""),
    source: clean(source.source || "")
  };
}

export function hasUsableRoute(value) {
  const route = normalizeRoute(value);
  return Boolean(route.folder && route.loginEntry);
}

export function routeFromLegacyStorage(storage) {
  if (!storage) return null;
  const activeManifest = parseJSON(storage.getItem("emeraldGoldShell_activeManifest"), null);
  if (activeManifest?.folder) return normalizeRoute(activeManifest);

  const folder = storage.getItem("emeraldGoldShell_activeFolder");
  if (!folder) return null;
  return normalizeRoute({
    activeVersion: storage.getItem("emeraldGoldShell_activeVersion") || "",
    activeFolder: folder,
    entry: storage.getItem("emeraldGoldShell_activeEntry") || "OS.html",
    loginEntry: storage.getItem("emeraldGoldShell_activeLoginEntry") || "index.html",
    source: "legacy-device-route"
  });
}

export function pendingRouteFromStorage(storage) {
  if (!storage) return null;
  const manifest = parseJSON(storage.getItem("emeraldGoldShell_pendingManifest"), null);
  if (manifest?.folder) return normalizeRoute({...manifest, source: "pending-manifest"});

  const folder = storage.getItem("emeraldGoldShell_pendingFolder");
  if (!folder) return null;
  return normalizeRoute({
    latestVersion: storage.getItem("emeraldGoldShell_pendingVersion") || "",
    folder,
    entry: storage.getItem("emeraldGoldShell_pendingEntry") || "OS.html",
    loginEntry: "index.html",
    source: "legacy-pending-route"
  });
}

export function isExplicitUpdateRequest(locationLike, storage) {
  const params = new URLSearchParams(locationLike?.search || "");
  const pending = pendingRouteFromStorage(storage);
  const applyFlag = storage?.getItem("emeraldGoldShell_applyUpdate") === "true";
  const forceCheck = storage?.getItem("emeraldGoldShell_forceCheck") === "true";
  return Boolean(
    params.get("applyUpdate") === "1" ||
    params.get("forceLatest") === "1" ||
    applyFlag ||
    (params.get("force") === "1" && forceCheck && pending)
  );
}

export function buildVersionLoginTarget(routeValue, username = "") {
  const route = normalizeRoute(routeValue);
  const params = new URLSearchParams({
    elsusShell: "2",
    elsusUser: clean(username),
    elsusVersion: route.latestVersion || route.build || "",
    elsusFolder: route.folder
  });
  return `./${encodeURIComponent(route.folder)}/${safeEntry(route.loginEntry, "index.html")}?${params.toString()}`;
}

export function parseJSON(value, fallback = null) {
  try {
    const parsed = JSON.parse(value);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}
