import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { issuePartnerToken } from "../middleware/partnerAuth.js";
import {
  findPartnerAccountByIdFromMemory,
  findPartnerAccountFromMemory,
  upsertCredentialResource
} from "../services/credentialStore.js";
import { getLocalResource, listLocalResource, upsertLocalResource } from "../services/localDataStore.js";

const PARTNER_DEFAULTS = {
  type: "partner",
  name: "New Partner",
  age: 24,
  gender: "Woman",
  city: "India",
  location: "India",
  profession: "Friend Hub Partner",
  bio: "Friendly profile on Friend Hub.",
  interests: ["Chatting"],
  photos: [],
  videos: [],
  welcomeMessage: "Hey! Thanks for connecting.",
  firstReply: "Nice to meet you.",
  secondReply: "Recharge to continue chatting.",
  freeReplyLimit: 1,
  delayMs: 650,
  chatPrice: 9,
  voiceCallPrice: 19,
  online: true,
  verified: true,
  showInDiscovery: true,
  showInMatches: true,
  allowAutoContact: true,
  active: true
};

function clean(value) {
  return String(value || "").trim();
}

function cleanList(value, limit) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean).slice(0, limit);
  return clean(value)
    .split(",")
    .map((item) => clean(item))
    .filter(Boolean)
    .slice(0, limit);
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toBoolean(value, fallback = true) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function maskAccount(account) {
  if (!account) return null;
  const {
    password,
    temporaryAccessCode,
    ...safe
  } = account;
  return safe;
}

function normalizePartnerProfile(partnerId, existing, payload = {}) {
  const base = { ...PARTNER_DEFAULTS, ...existing, id: partnerId, type: "partner" };
  const patch = {};

  if (payload.name != null) patch.name = clean(payload.name) || base.name;
  if (payload.displayName != null) patch.name = clean(payload.displayName) || base.name;
  if (payload.age != null) patch.age = Math.max(18, Math.min(99, toNumber(payload.age, base.age)));
  if (payload.gender != null) patch.gender = clean(payload.gender) || base.gender;
  if (payload.city != null) patch.city = clean(payload.city) || base.city;
  if (payload.location != null) patch.location = clean(payload.location) || patch.city || base.location;
  if (payload.profession != null) patch.profession = clean(payload.profession) || base.profession;
  if (payload.bio != null) patch.bio = clean(payload.bio) || base.bio;
  if (payload.welcomeMessage != null) patch.welcomeMessage = clean(payload.welcomeMessage) || base.welcomeMessage;
  if (payload.firstReply != null) patch.firstReply = clean(payload.firstReply) || base.firstReply;
  if (payload.secondReply != null) patch.secondReply = clean(payload.secondReply) || base.secondReply;
  if (payload.interests != null) patch.interests = cleanList(payload.interests, 30);
  if (payload.photos != null) patch.photos = cleanList(payload.photos, 10);
  if (payload.videos != null) patch.videos = cleanList(payload.videos, 3);

  if (payload.freeReplyLimit != null) patch.freeReplyLimit = Math.max(0, toNumber(payload.freeReplyLimit, base.freeReplyLimit));
  if (payload.delayMs != null) patch.delayMs = Math.max(0, toNumber(payload.delayMs, base.delayMs));
  if (payload.chatPrice != null) patch.chatPrice = Math.max(0, toNumber(payload.chatPrice, base.chatPrice));
  if (payload.voiceCallPrice != null) patch.voiceCallPrice = Math.max(0, toNumber(payload.voiceCallPrice, base.voiceCallPrice));
  if (payload.distanceKm != null) patch.distanceKm = Math.max(0, toNumber(payload.distanceKm, base.distanceKm || 2));
  if (payload.lat != null) patch.lat = toNumber(payload.lat, base.lat || 0);
  if (payload.lng != null) patch.lng = toNumber(payload.lng, base.lng || 0);

  if (payload.online != null) patch.online = toBoolean(payload.online, base.online !== false);
  if (payload.verified != null) patch.verified = toBoolean(payload.verified, base.verified !== false);
  if (payload.showInDiscovery != null) patch.showInDiscovery = toBoolean(payload.showInDiscovery, base.showInDiscovery !== false);
  if (payload.showInMatches != null) patch.showInMatches = toBoolean(payload.showInMatches, base.showInMatches !== false);
  if (payload.allowAutoContact != null) patch.allowAutoContact = toBoolean(payload.allowAutoContact, base.allowAutoContact !== false);
  if (payload.active != null) patch.active = toBoolean(payload.active, base.active !== false);

  return { ...base, ...patch };
}

async function findPartnerAccountByLogin(loginId, password) {
  const localMemory = findPartnerAccountFromMemory(loginId, password);
  if (localMemory) return { source: "memory", account: localMemory };

  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts")
        .where("loginId", "==", clean(loginId))
        .where("active", "==", true)
        .limit(10)
        .get();
      const account = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((item) => String(item.password || item.temporaryAccessCode || "") === String(password || ""));
      if (account) {
        upsertCredentialResource("partnerAccounts", account);
        return { source: "firestore", account };
      }
    } catch {}
  }

  const localList = await listLocalResource("partnerAccounts");
  const local = localList.find((item) =>
    item.active !== false &&
    clean(item.loginId) === clean(loginId) &&
    String(item.password || item.temporaryAccessCode || "") === String(password || "")
  );
  if (local) {
    upsertCredentialResource("partnerAccounts", local);
    return { source: "local", account: local };
  }
  return { source: "none", account: null };
}

async function findPartnerAccountById(accountId) {
  const memory = findPartnerAccountByIdFromMemory(accountId);
  if (memory) return memory;

  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts").doc(accountId).get();
      if (snap.exists) {
        const account = { id: snap.id, ...snap.data() };
        upsertCredentialResource("partnerAccounts", account);
        return account;
      }
    } catch {}
  }

  const local = await getLocalResource("partnerAccounts", accountId);
  if (local) upsertCredentialResource("partnerAccounts", local);
  return local;
}

async function loadOrCreatePartnerProfile(partnerId, account = null) {
  if (hasFirestoreCredentials) {
    try {
      const ref = db.collection("partners").doc(partnerId);
      const snap = await ref.get();
      if (snap.exists) return { id: snap.id, ...snap.data() };
      const fresh = normalizePartnerProfile(partnerId, null, {
        name: account?.displayName || account?.loginId || PARTNER_DEFAULTS.name
      });
      await ref.set({
        ...fresh,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return fresh;
    } catch {}
  }
  const local = await getLocalResource("partners", partnerId);
  if (local) return local;
  const fresh = normalizePartnerProfile(partnerId, null, {
    name: account?.displayName || account?.loginId || PARTNER_DEFAULTS.name
  });
  await upsertLocalResource("partners", { ...fresh, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return fresh;
}

async function savePartnerProfile(partnerId, profile) {
  const now = new Date().toISOString();
  if (hasFirestoreCredentials) {
    try {
      await db.collection("partners").doc(partnerId).set({
        ...profile,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch {}
  }
  await upsertLocalResource("partners", { ...profile, updatedAt: now });
  return profile;
}

async function savePartnerAccount(account) {
  const now = new Date().toISOString();
  if (hasFirestoreCredentials) {
    try {
      await db.collection("partnerAccounts").doc(account.id).set({
        ...account,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch {}
  }
  await upsertLocalResource("partnerAccounts", { ...account, updatedAt: now });
  upsertCredentialResource("partnerAccounts", { ...account, updatedAt: now });
}

export async function partnerLogin(req, res) {
  const loginId = clean(req.body?.id || req.body?.loginId);
  const password = String(req.body?.password || "");
  if (!loginId || !password) {
    return res.status(400).json({ message: "ID and password required." });
  }

  const { account } = await findPartnerAccountByLogin(loginId, password);
  if (!account) return res.status(401).json({ message: "Partner ID/password galat hai." });

  const partnerId = clean(account.partnerId || account.id || `partner_${loginId}`);
  const profile = await loadOrCreatePartnerProfile(partnerId, account);
  const token = issuePartnerToken({
    role: "partner",
    accountId: account.id,
    partnerId,
    loginId
  });
  res.json({
    ok: true,
    token,
    session: {
      partnerId,
      accountId: account.id,
      loginId
    },
    profile,
    account: maskAccount(account)
  });
}

export async function partnerMe(req, res) {
  const partnerId = clean(req.partner?.partnerId);
  if (!partnerId) return res.status(401).json({ message: "Invalid partner session." });
  const profile = await loadOrCreatePartnerProfile(partnerId);
  const account = await findPartnerAccountById(clean(req.partner?.accountId));
  res.json({
    session: req.partner,
    profile,
    account: maskAccount(account)
  });
}

export async function updatePartnerProfile(req, res) {
  const partnerId = clean(req.partner?.partnerId);
  if (!partnerId) return res.status(401).json({ message: "Invalid partner session." });
  const existing = await loadOrCreatePartnerProfile(partnerId);
  const next = normalizePartnerProfile(partnerId, existing, req.body || {});
  await savePartnerProfile(partnerId, next);
  res.json({ ok: true, profile: next });
}

export async function updatePartnerCredential(req, res) {
  const accountId = clean(req.partner?.accountId);
  if (!accountId) return res.status(401).json({ message: "Invalid partner session." });

  const account = await findPartnerAccountById(accountId);
  if (!account || account.active === false) return res.status(404).json({ message: "Partner account not found." });

  const currentPassword = String(account.password || account.temporaryAccessCode || "");
  const oldPassword = String(req.body?.oldPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  const newLoginId = clean(req.body?.loginId || account.loginId);

  if (!oldPassword || oldPassword !== currentPassword) {
    return res.status(400).json({ message: "Current password mismatch." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  const next = {
    ...account,
    loginId: newLoginId,
    temporaryAccessCode: newPassword,
    password: newPassword
  };
  await savePartnerAccount(next);

  const token = issuePartnerToken({
    role: "partner",
    accountId: next.id,
    partnerId: next.partnerId || next.id,
    loginId: next.loginId
  });

  res.json({
    ok: true,
    token,
    account: maskAccount(next)
  });
}
