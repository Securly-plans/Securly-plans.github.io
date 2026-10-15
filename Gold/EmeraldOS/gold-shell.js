"use strict";

import * as fb from "./firebase.js";
import {
  DEFAULT_ROUTE,
  buildVersionLoginTarget,
  clean,
  isExplicitUpdateRequest,
  normalizeRoute,
  parseJSON,
  pendingRouteFromStorage,
  routeFromLegacyStorage,
  safeFolder
} from "./gold-shell-routing.js";

const SHELL_VERSION = "2.0";
const LOCAL_USERS_KEY = "emerald_gold_local_users";
const USER_ROUTES_KEY = "emeraldGoldShellV2_userRoutes";
const LAST_USER_KEY = "emeraldGoldShellV2_lastUser";
const SESSION_KEY = "emeraldGoldShellV2_identification";
const REDIRECT_DELAY = 1400;

const $ = id => document.getElementById(id);
const lower = value => clean(value).toLowerCase();
const now = () => new Date().toISOString();

let redirectTimer = null;
let resolvedAccount = null;
let resolvedRoute = null;
let routeSource = "";

function setStatus(text, type = "") {
  const element = $("shellStatus");
  if (!element) return;
  element.textContent = text;
  element.className = `shell-status ${type}`.trim();
}

function setMessage(text, type = "") {
  const element = $("loginMessage");
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function setBusy(busy) {
  const button = $("loginBtn");
  if (button) {
    button.disabled = busy;
    button.textContent = busy ? "Checking account..." : "Continue";
  }
  ["loginUsername", "loginPassword", "showPassword"].forEach(id => {
    const element = $(id);
    if (element) element.disabled = busy;
  });
}

async function sha256(text) {
  if (!crypto?.subtle) throw new Error("Secure password verification is unavailable in this browser.");
  const bytes = new TextEncoder().encode(String(text ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function passwordMatches(record, hash, plainPassword) {
  if (!record || typeof record !== "object") return false;
  const hashes = [
    record.passwordHash,
    record.password_hash,
    record.hashedPassword,
    record.sha256
  ].map(lower).filter(Boolean);
  if (hashes.includes(lower(hash))) return true;

  // Compatibility with very old EmeraldOS account records.
  const legacyPlain = [record.password, record.pass]
    .map(value => String(value ?? ""))
    .filter(Boolean);
  return legacyPlain.includes(String(plainPassword ?? ""));
}

function accountUsername(record, fallback = "") {
  return clean(record?.username || record?.displayUsername || record?.userName || fallback);
}

async function readDirectUser(collectionName, id) {
  if (!fb.db || !id) return null;
  try {
    const snapshot = await fb.getDoc(fb.doc(fb.db, collectionName, id));
    if (!snapshot.exists()) return null;
    return {...snapshot.data(), __id: snapshot.id, __collection: collectionName};
  } catch (error) {
    console.debug(`Shell V2 could not read ${collectionName}/${id}.`, error?.message || error);
    return null;
  }
}

async function scanForUser(collectionName, requestedLower) {
  if (!fb.db) return null;
  try {
    const snapshot = await fb.getDocs(fb.collection(fb.db, collectionName));
    let match = null;
    snapshot.forEach(item => {
      if (match) return;
      const data = item.data();
      if (lower(accountUsername(data, item.id)) === requestedLower || lower(item.id) === requestedLower) {
        match = {...data, __id: item.id, __collection: collectionName};
      }
    });
    return match;
  } catch (error) {
    console.debug(`Shell V2 could not scan ${collectionName}.`, error?.message || error);
    return null;
  }
}

async function findCloudAccount(username) {
  if (!fb.db) return null;
  const requested = clean(username);
  const requestedLower = lower(requested);
  const ids = [...new Set([requested, requestedLower])].filter(Boolean);
  const collections = ["users", "emeraldOSUsers"];

  for (const collectionName of collections) {
    for (const id of ids) {
      const account = await readDirectUser(collectionName, id);
      if (!account) continue;
      const foundName = lower(accountUsername(account, account.__id));
      if (!foundName || foundName === requestedLower || lower(account.__id) === requestedLower) return account;
    }
  }

  for (const collectionName of collections) {
    const account = await scanForUser(collectionName, requestedLower);
    if (account) return account;
  }
  return null;
}

function readLocalAccount(username) {
  const users = parseJSON(localStorage.getItem(LOCAL_USERS_KEY), {});
  return users && typeof users === "object" ? users[lower(username)] || null : null;
}

async function authenticate(username, password) {
  const requested = clean(username);
  if (!requested || !password) throw new Error("Enter your EmeraldOS username and password.");
  const hash = await sha256(password);

  const cloud = await findCloudAccount(requested);
  if (cloud) {
    if (cloud.locked === true) throw new Error(cloud.lockReason || "This EmeraldOS account is locked.");
    if (!passwordMatches(cloud, hash, password)) throw new Error("Incorrect username or password.");
    const resolvedUsername = accountUsername(cloud, requested) || requested;
    return {
      ...cloud,
      username: resolvedUsername,
      userId: clean(cloud.userId || cloud.__id || resolvedUsername),
      cloud: true
    };
  }

  const local = readLocalAccount(requested);
  if (!local || !passwordMatches(local, hash, password)) throw new Error("Incorrect username or password.");
  if (local.locked === true) throw new Error(local.lockReason || "This EmeraldOS account is locked.");
  return {
    ...local,
    username: clean(local.username || requested),
    userId: clean(local.userId || local.username || requested),
    cloud: false,
    __id: clean(local.userId || local.username || requested),
    __collection: "local"
  };
}

function routeCandidates(account) {
  return [...new Set([
    clean(account?.__id),
    clean(account?.userId),
    clean(account?.username),
    lower(account?.username),
    lower(account?.__id)
  ])].filter(Boolean);
}

function routeDataFromDocument(data, id, source) {
  if (!data || typeof data !== "object") return null;
  const hasRoute = data.activeFolder || data.currentFolder || data.versionFolder || data.folder;
  if (!hasRoute) return null;
  return normalizeRoute({...data, source: `${source}:${id}`});
}

async function readCloudRoute(account) {
  if (!fb.db || !account?.cloud) return null;
  for (const id of routeCandidates(account)) {
    try {
      const current = await fb.getDoc(fb.doc(fb.db, "emeraldOSUsers", id, "goldVM", "current"));
      if (current.exists()) {
        const route = routeDataFromDocument(current.data(), id, "goldVM/current");
        if (route) return {route, vmDocumentId: id};
      }
    } catch (error) {
      console.debug(`Shell V2 could not read ${id}/goldVM/current.`, error?.message || error);
    }

    try {
      const root = await fb.getDoc(fb.doc(fb.db, "emeraldOSUsers", id));
      if (root.exists()) {
        const route = routeDataFromDocument(root.data(), id, "emeraldOSUsers");
        if (route) return {route, vmDocumentId: id};
      }
    } catch (error) {
      console.debug(`Shell V2 could not read emeraldOSUsers/${id}.`, error?.message || error);
    }
  }
  return null;
}

function readPerUserRoute(username) {
  const map = parseJSON(localStorage.getItem(USER_ROUTES_KEY), {});
  const value = map?.[lower(username)];
  return value?.folder ? normalizeRoute({...value, source: "shell-v2-user-cache"}) : null;
}

function savePerUserRoute(username, route) {
  const map = parseJSON(localStorage.getItem(USER_ROUTES_KEY), {});
  const next = map && typeof map === "object" ? map : {};
  next[lower(username)] = {...normalizeRoute(route), savedAt: now()};
  localStorage.setItem(USER_ROUTES_KEY, JSON.stringify(next));
}

function readCompatibleDeviceRoute(username) {
  const knownUser = lower(
    localStorage.getItem(LAST_USER_KEY) ||
    localStorage.getItem("emeraldGoldShell_lastUser") ||
    localStorage.getItem("username") ||
    ""
  );
  if (knownUser && knownUser !== lower(username)) return null;
  return routeFromLegacyStorage(localStorage);
}

async function readLatestManifest() {
  const cached = parseJSON(localStorage.getItem("emeraldGoldShell_latest"), null);
  if (fb.db) {
    try {
      const snapshot = await fb.getDoc(fb.doc(fb.db, "system", "emeraldGoldLatest"));
      if (snapshot.exists()) {
        const latest = normalizeRoute({...snapshot.data(), source: "system/emeraldGoldLatest"}, cached || DEFAULT_ROUTE);
        localStorage.setItem("emeraldGoldShell_latest", JSON.stringify(latest));
        return latest;
      }
    } catch (error) {
      console.debug("Shell V2 used the cached latest manifest.", error?.message || error);
    }
  }
  return normalizeRoute(cached || DEFAULT_ROUTE);
}

function updateRequested() {
  return isExplicitUpdateRequest(location, localStorage);
}

async function resolveUserRoute(account) {
  const cloud = await readCloudRoute(account);
  const cached = readPerUserRoute(account.username);
  const compatibleDevice = readCompatibleDeviceRoute(account.username);
  const latest = await readLatestManifest();
  const pending = pendingRouteFromStorage(localStorage);
  const applyingUpdate = updateRequested();

  if (applyingUpdate) {
    const target = normalizeRoute(pending || latest, latest);
    return {
      route: target,
      source: pending ? "user-approved-pending-update" : "user-approved-latest-update",
      vmDocumentId: cloud?.vmDocumentId || routeCandidates(account)[0] || account.username,
      applyingUpdate: true
    };
  }

  if (cloud?.route) return {route: cloud.route, source: "cloud-vm", vmDocumentId: cloud.vmDocumentId, applyingUpdate: false};
  if (cached) return {route: cached, source: "shell-v2-user-cache", vmDocumentId: routeCandidates(account)[0], applyingUpdate: false};
  if (compatibleDevice) return {route: compatibleDevice, source: "compatible-device-route", vmDocumentId: routeCandidates(account)[0], applyingUpdate: false};
  return {route: latest, source: "first-use-latest-fallback", vmDocumentId: routeCandidates(account)[0], applyingUpdate: false};
}

function persistCompatibilityRoute(account, route) {
  const normalized = normalizeRoute(route);
  savePerUserRoute(account.username, normalized);
  localStorage.setItem(LAST_USER_KEY, account.username);
  localStorage.setItem("emeraldGoldShell_lastUser", account.username);
  localStorage.setItem("emeraldGoldShell_activeVersion", normalized.latestVersion || normalized.build || "");
  localStorage.setItem("emeraldGoldShell_activeFolder", normalized.folder);
  localStorage.setItem("emeraldGoldShell_activeEntry", normalized.entry || "OS.html");
  localStorage.setItem("emeraldGoldShell_activeLoginEntry", normalized.loginEntry || "index.html");
  localStorage.setItem("emeraldGoldShell_activeManifest", JSON.stringify(normalized));
  localStorage.setItem("emeraldGoldShell_lastBoot", now());
}

async function persistApprovedUpdate(account, route, vmDocumentId) {
  if (!fb.db || !account.cloud) return false;
  const id = clean(vmDocumentId || routeCandidates(account)[0] || account.username);
  if (!id) return false;
  const normalized = normalizeRoute(route);
  try {
    // Merge routing metadata only. Existing files, settings, preferences and split
    // VM categories are never replaced by Shell V2.
    await fb.setDoc(fb.doc(fb.db, "emeraldOSUsers", id, "goldVM", "current"), {
      activeVersion: normalized.latestVersion || normalized.build || "",
      activeFolder: normalized.folder,
      entry: normalized.entry || "OS.html",
      loginEntry: normalized.loginEntry || "index.html",
      channel: normalized.channel || "stable",
      lastManualUpdate: now(),
      lastShellVersion: SHELL_VERSION,
      shellV2RoutingOnly: true
    }, {merge: true});
    return true;
  } catch (error) {
    console.warn("Shell V2 could not merge approved update routing metadata.", error);
    return false;
  }
}

function clearApprovedUpdateFlags() {
  [
    "emeraldGoldShell_applyUpdate",
    "emeraldGoldShell_forceCheck",
    "emeraldGoldShell_pendingManifest",
    "emeraldGoldShell_pendingVersion",
    "emeraldGoldShell_pendingFolder",
    "emeraldGoldShell_pendingEntry"
  ].forEach(key => localStorage.removeItem(key));
}

function saveIdentificationSession(account, route) {
  const value = {
    username: account.username,
    userId: account.userId,
    cloud: Boolean(account.cloud),
    version: route.latestVersion || route.build || "",
    folder: route.folder,
    verifiedAt: now(),
    shellVersion: SHELL_VERSION
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  localStorage.setItem("emeraldGoldShell_prefillUsername", account.username);
  // Deliberately do not set loggedIn=true. The selected version must show and
  // enforce its own normal login page.
}

function describeSource(source) {
  const names = {
    "cloud-vm": "your cloud VM profile",
    "shell-v2-user-cache": "your Shell V2 device profile",
    "compatible-device-route": "the compatible E.L.S.U.S. device route",
    "first-use-latest-fallback": "the latest staff-published release",
    "user-approved-pending-update": "the update you approved inside EmeraldOS",
    "user-approved-latest-update": "the latest update you approved"
  };
  return names[source] || source || "your EmeraldOS profile";
}

function showResolved(account, route, source) {
  resolvedAccount = account;
  resolvedRoute = normalizeRoute(route);
  routeSource = source;
  $("loginPanel")?.classList.add("hidden");
  $("routePanel")?.classList.remove("hidden");
  $("routeUser").textContent = account.username;
  $("routeVersion").textContent = resolvedRoute.releaseTitle || `EmeraldOS Gold ${resolvedRoute.latestVersion || resolvedRoute.build}`;
  $("routeFolder").textContent = `${resolvedRoute.folder}/${resolvedRoute.loginEntry}`;
  $("routeSource").textContent = `Selected from ${describeSource(source)}.`;
  setStatus(`Opening ${resolvedRoute.releaseTitle || resolvedRoute.folder}.`, "good");

  redirectTimer = setTimeout(openResolvedVersion, REDIRECT_DELAY);
}

function clearVersionLoginState() {
  const directKeys = [
    "loggedIn",
    "role",
    "role2",
    "userId"
  ];
  directKeys.forEach(key => localStorage.removeItem(key));

  // Each Gold release uses its own namespace. Clear only session/authentication
  // markers so the selected version displays its own login page. Files, settings,
  // preferences and VM data are not touched.
  const removable = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (/(^|[_-])loggedin$/i.test(key) || /staff_session$/i.test(key) || /publisher_(unlocked|pin_unlocked)$/i.test(key)) {
      removable.push(key);
    }
  }
  removable.forEach(key => localStorage.removeItem(key));
}

function openResolvedVersion() {
  if (!resolvedAccount || !resolvedRoute) return;
  if (redirectTimer) clearTimeout(redirectTimer);
  clearVersionLoginState();
  const target = buildVersionLoginTarget(resolvedRoute, resolvedAccount.username);
  location.replace(target);
}

async function handleLogin() {
  const username = $("loginUsername")?.value || "";
  const password = $("loginPassword")?.value || "";
  setMessage("");
  setBusy(true);
  setStatus("Verifying your EmeraldOS account.");

  try {
    const account = await authenticate(username, password);
    setStatus("Finding this user’s active EmeraldOS Gold version.");
    const resolution = await resolveUserRoute(account);
    const route = normalizeRoute(resolution.route);
    if (!safeFolder(route.folder)) throw new Error("The saved EmeraldOS version folder is invalid.");

    persistCompatibilityRoute(account, route);
    if (resolution.applyingUpdate) {
      await persistApprovedUpdate(account, route, resolution.vmDocumentId);
      clearApprovedUpdateFlags();
      localStorage.setItem("emeraldGold_updateJustApplied", "true");
      localStorage.setItem("emeraldGold_updateNotice", JSON.stringify({
        to: route.latestVersion || route.build || "",
        title: route.releaseTitle || `EmeraldOS Gold ${route.latestVersion || route.build || ""}`,
        summary: route.summary || "Your selected EmeraldOS Gold update is ready.",
        time: now()
      }));
    }
    saveIdentificationSession(account, route);
    showResolved(account, route, resolution.source);
  } catch (error) {
    console.error(error);
    setMessage(error?.message || "EmeraldOS account verification failed.", "bad");
    setStatus("Sign-in was not completed.", "bad");
  } finally {
    setBusy(false);
  }
}

function resetLogin() {
  if (redirectTimer) clearTimeout(redirectTimer);
  resolvedAccount = null;
  resolvedRoute = null;
  routeSource = "";
  $("routePanel")?.classList.add("hidden");
  $("loginPanel")?.classList.remove("hidden");
  $("loginPassword").value = "";
  setMessage("");
  setStatus("Sign in so E.L.S.U.S. can locate your active Gold version.");
  $("loginUsername")?.focus();
}

function initialize() {
  $("shellVersion").textContent = `Shell ${SHELL_VERSION}`;
  setStatus("Sign in so E.L.S.U.S. can locate your active Gold version.");
  $("loginBtn")?.addEventListener("click", handleLogin);
  $("loginPassword")?.addEventListener("keydown", event => {
    if (event.key === "Enter") handleLogin();
  });
  $("loginUsername")?.addEventListener("keydown", event => {
    if (event.key === "Enter") $("loginPassword")?.focus();
  });
  $("showPassword")?.addEventListener("change", event => {
    $("loginPassword").type = event.currentTarget.checked ? "text" : "password";
  });
  $("openVersionBtn")?.addEventListener("click", openResolvedVersion);
  $("differentUserBtn")?.addEventListener("click", resetLogin);

  const previousUser = clean(localStorage.getItem(LAST_USER_KEY) || localStorage.getItem("emeraldGoldShell_prefillUsername"));
  if (previousUser) $("loginUsername").value = previousUser;
  (previousUser ? $("loginPassword") : $("loginUsername"))?.focus();
}

window.ELSUSShellV2 = Object.freeze({
  version: SHELL_VERSION,
  mode: "identify-then-route-to-version-login",
  getResolvedRoute: () => resolvedRoute ? {...resolvedRoute, source: routeSource} : null
});

window.addEventListener("DOMContentLoaded", initialize);
