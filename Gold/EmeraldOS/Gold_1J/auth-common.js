"use strict";

window.GoldAuth = (() => {
  const LOCAL_USERS_KEY = "emerald_gold_local_users";
  const MAIL_API = "https://emerald-mail-router.wyatt-monroe2013.workers.dev";
  const STAFF_ROLES = [
    "admin",
    "administrator",
    "operator",
    "moderator",
    "mod",
    "staff",
    "executive",
    "owner",
    "network administrator",
    "network admin",
    "vip"
  ];

  let firebasePromise = null;

  const normalize = value => String(value ?? "").trim();
  const normalizeLower = value => normalize(value).toLowerCase();

  async function hash(text) {
    if (!globalThis.crypto?.subtle) {
      throw new Error("Secure password hashing is not available in this browser.");
    }
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(String(text ?? ""))
    );
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function readUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  async function firebase() {
    if (!firebasePromise) {
      firebasePromise = import("./firebase.js").catch(error => {
        console.warn("Firebase could not be loaded.", error);
        return null;
      });
    }
    return firebasePromise;
  }

  function passwordMatches(record, passwordHash, plainPassword) {
    if (!record || typeof record !== "object") return false;

    const hashFields = [
      record.passwordHash,
      record.password_hash,
      record.hashedPassword,
      record.sha256,
      record.mailPasswordHash
    ]
      .map(value => normalizeLower(value))
      .filter(Boolean);

    if (hashFields.some(value => value === passwordHash)) return true;

    // Compatibility only for older Emerald records that stored a plain password.
    const legacyPlainFields = [record.password, record.pass, record.mailPassword]
      .map(value => String(value ?? ""))
      .filter(Boolean);

    return legacyPlainFields.some(value => value === String(plainPassword ?? ""));
  }

  function accountUsername(record, fallback = "") {
    return normalize(
      record?.username ||
      record?.displayUsername ||
      record?.userName ||
      fallback
    );
  }

  async function directDocument(fb, collectionName, id) {
    if (!id) return null;
    try {
      const snapshot = await fb.getDoc(fb.doc(fb.db, collectionName, id));
      if (!snapshot.exists()) return null;
      return {
        ...snapshot.data(),
        __id: snapshot.id,
        __collection: collectionName
      };
    } catch (error) {
      console.warn(`Could not read ${collectionName}/${id}.`, error);
      return null;
    }
  }

  async function scanCollection(fb, collectionName, matcher) {
    try {
      const snapshot = await fb.getDocs(fb.collection(fb.db, collectionName));
      let match = null;
      snapshot.forEach(documentSnapshot => {
        if (match) return;
        const data = documentSnapshot.data();
        if (matcher(data, documentSnapshot.id)) {
          match = {
            ...data,
            __id: documentSnapshot.id,
            __collection: collectionName
          };
        }
      });
      return match;
    } catch (error) {
      console.warn(`Could not scan ${collectionName}.`, error);
      return null;
    }
  }

  async function findCloudUser(username) {
    const requested = normalize(username);
    const requestedLower = requested.toLowerCase();
    const fb = await firebase();
    if (!fb?.db) return null;

    const ids = [...new Set([requested, requestedLower])].filter(Boolean);
    const collections = ["users", "emeraldOSUsers"];

    for (const collectionName of collections) {
      for (const id of ids) {
        const found = await directDocument(fb, collectionName, id);
        if (!found) continue;
        const foundName = normalizeLower(accountUsername(found, found.__id));
        if (!foundName || foundName === requestedLower || normalizeLower(found.__id) === requestedLower) {
          return found;
        }
      }
    }

    // Existing EmeraldOS versions often used lowercase document IDs while keeping
    // the original capitalization in the username field. A collection scan keeps
    // Gold 1J compatible with both layouts.
    for (const collectionName of collections) {
      const found = await scanCollection(
        fb,
        collectionName,
        (data, id) =>
          normalizeLower(accountUsername(data, id)) === requestedLower ||
          normalizeLower(id) === requestedLower
      );
      if (found) return found;
    }

    return null;
  }

  async function login(username, password) {
    const requested = normalize(username);
    if (!requested || !password) {
      throw new Error("Enter your username and password.");
    }

    const passwordHash = await hash(password);
    const cloud = await findCloudUser(requested);

    if (cloud) {
      if (cloud.locked === true) {
        throw new Error(cloud.lockReason || "This account is locked.");
      }
      if (!passwordMatches(cloud, passwordHash, password)) {
        throw new Error("Incorrect username or password.");
      }

      const resolvedUsername = accountUsername(cloud, requested) || requested;
      return {
        ...cloud,
        username: resolvedUsername,
        role: cloud.role || "user",
        role2: cloud.role2 || "User",
        userId: cloud.userId || cloud.__id || resolvedUsername,
        cloud: true
      };
    }

    const users = readUsers();
    const local = users[requested.toLowerCase()];
    if (!local || !passwordMatches(local, passwordHash, password)) {
      throw new Error("Incorrect username or password.");
    }
    if (local.locked === true) {
      throw new Error(local.lockReason || "This account is locked.");
    }

    return {
      ...local,
      username: local.username || requested,
      userId: local.userId || local.username || requested,
      cloud: false
    };
  }

  async function register(username, password, displayName, email = "") {
    const requested = normalize(username);
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(requested)) {
      throw new Error("Use 3–32 letters, numbers, periods, underscores, or hyphens.");
    }
    if (String(password).length < 6) {
      throw new Error("Use a password with at least 6 characters.");
    }
    if (await findCloudUser(requested)) {
      throw new Error("That username is already registered.");
    }

    const users = readUsers();
    const localId = requested.toLowerCase();
    if (users[localId]) {
      throw new Error("That username is already registered.");
    }

    const record = {
      username: requested,
      displayName: normalize(displayName) || requested,
      email: normalize(email),
      passwordHash: await hash(password),
      role: "user",
      role2: "User",
      locked: false,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      userId: localId,
      emeraldOSGold: {
        registeredFrom: "Gold 1J",
        workspacePath: "goldVM/current"
      }
    };

    users[localId] = record;
    saveUsers(users);

    const fb = await firebase();
    if (fb?.db) {
      let cloudWriteSucceeded = false;
      try {
        await fb.setDoc(fb.doc(fb.db, "users", localId), record, { merge: true });
        cloudWriteSucceeded = true;
      } catch (error) {
        console.warn("Could not create the users authentication record.", error);
      }
      try {
        await fb.setDoc(
          fb.doc(fb.db, "emeraldOSUsers", requested),
          {
            username: requested,
            displayName: record.displayName,
            email: record.email,
            role: record.role,
            role2: record.role2,
            passwordHash: record.passwordHash,
            created: record.created,
            lastUpdated: record.lastUpdated
          },
          { merge: true }
        );
        cloudWriteSucceeded = true;
      } catch (error) {
        console.warn("Could not create the EmeraldOS cloud profile.", error);
      }
      record.cloud = cloudWriteSucceeded;
    } else {
      record.cloud = false;
    }

    return record;
  }

  function roleValues(user) {
    return [
      user?.role,
      user?.role2,
      user?.position,
      user?.clearance,
      user?.staffRole
    ]
      .map(normalizeLower)
      .filter(Boolean);
  }

  function isStaffUser(user) {
    if (user?.isAdmin === true || user?.admin === true || user?.staff === true) return true;
    return roleValues(user).some(value =>
      STAFF_ROLES.some(role => value === role || value.includes(role))
    );
  }

  function normalizeMailAddress(value) {
    return normalizeLower(value);
  }

  async function findMailRecord(address) {
    const mail = normalizeMailAddress(address);
    const localPart = mail.split("@")[0] || mail;
    const fb = await firebase();
    if (!fb?.db) return null;

    const ids = [...new Set([mail, normalize(address), localPart, mail.replaceAll("/", "_")])]
      .filter(Boolean);

    for (const id of ids) {
      const found = await directDocument(fb, "EmeraldMail", id);
      if (!found) continue;
      const candidate = normalizeMailAddress(
        found.address || found.email || found.mail || found.__id
      );
      const candidateUser = normalizeLower(found.username);
      if (candidate === mail || candidateUser === localPart) return found;
    }

    return scanCollection(fb, "EmeraldMail", (data, id) => {
      const candidate = normalizeMailAddress(data.address || data.email || data.mail || id);
      const candidateUser = normalizeLower(data.username);
      return candidate === mail || candidateUser === localPart;
    });
  }

  async function verifyMailThroughWorker(address, password) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${MAIL_API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        const error = new Error(data.error || "Emerald Mail credentials were not accepted.");
        error.authenticationRejected = response.status === 400 || response.status === 401 || response.status === 403;
        throw error;
      }
      return {
        verified: true,
        source: "worker",
        address: normalizeMailAddress(data.account?.address || address),
        account: data.account || { address: normalizeMailAddress(address) },
        token: data.token || ""
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function verifyEmeraldMail(address, password) {
    const mail = normalizeMailAddress(address);
    if (!mail || !password) {
      throw new Error("Enter your Emerald Mail address and password.");
    }
    if (!/^[^@\s]+@[^@\s]+$/.test(mail)) {
      throw new Error("Enter a complete Emerald Mail address.");
    }

    try {
      return await verifyMailThroughWorker(mail, password);
    } catch (workerError) {
      if (workerError?.authenticationRejected) throw workerError;
      console.warn("Emerald Mail Worker verification was unavailable; trying Firestore.", workerError);
    }

    const record = await findMailRecord(mail);
    if (!record) {
      throw new Error("Emerald Mail account was not found.");
    }
    if (record.enabled === false || record.disabled === true) {
      throw new Error("This Emerald Mail account is disabled.");
    }

    const passwordHash = await hash(password);
    if (!passwordMatches(record, passwordHash, password)) {
      throw new Error("Emerald Mail password did not match.");
    }

    return {
      verified: true,
      source: "firestore",
      address: normalizeMailAddress(record.address || record.email || record.mail || mail),
      account: record,
      token: ""
    };
  }

  function beginSession(user) {
    const username = normalize(user?.username || user?.userName || user?.userId);
    const role = user?.role || "user";
    const role2 = user?.role2 || "User";
    const userId = user?.userId || user?.__id || username;

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("gold1g_loggedIn", "true");
    localStorage.setItem("gold1j_loggedIn", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("gold1g_username", username);
    localStorage.setItem("gold1j_username", username);
    localStorage.setItem("role", role);
    localStorage.setItem("role2", role2);
    localStorage.setItem("gold1g_role", role);
    localStorage.setItem("gold1g_role2", role2);
    localStorage.setItem("userId", userId);
    localStorage.setItem("gold1j_last_login", new Date().toISOString());
  }

  async function serviceStatus() {
    const fb = await firebase();
    return {
      firebase: Boolean(fb?.db),
      projectId: fb?.firebaseConfigured === false ? "" : "securly-plans-main",
      mailApi: MAIL_API
    };
  }

  return {
    MAIL_API,
    STAFF_ROLES: [...STAFF_ROLES],
    hash,
    login,
    register,
    beginSession,
    findCloudUser,
    findMailRecord,
    verifyEmeraldMail,
    isStaffUser,
    readUsers,
    serviceStatus
  };
})();
