import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { env } from "../config/env.js";
import { issuePartnerToken } from "../middleware/partnerAuth.js";
import {
  findPartnerAccountByIdFromMemory,
  findPartnerAccountFromMemory,
  upsertCredentialResource
} from "../services/credentialStore.js";
import { getLocalResource, hasLocalResource, listLocalResource, upsertLocalResource } from "../services/localDataStore.js";

const MAX_PHOTOS = 7;
const MAX_VIDEOS = 2;
const MAX_INTERESTS = 30;

function shouldUseLocalFallback() {
  return env.nodeEnv !== "production";
}

function databaseError() {
  const error = new Error("Database connection failed. Please check Firestore environment variables.");
  error.status = 503;
  return error;
}

const PARTNER_DEFAULTS = {
  type: "partner",
  name: "New Partner",
  age: 24,
  gender: "Woman",
  city: "India",
  location: "India",
  profession: "Friend Hub Partner",
  category: "community",
  phone: "",
  bio: "Friendly profile on Friend Hub.",
  interests: ["Chatting"],
  photos: [],
  galleryPhotos: [],
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

function toKey(value) {
  return clean(value).toLowerCase();
}

function slugify(value) {
  const base = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `partner_${Date.now()}`;
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
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
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

function isMainRole(account) {
  if (!account) return false;
  if (account.role === "main_partner" || account.isMain === true) return true;
  return toKey(account.loginId) === toKey(env.defaultPartnerLoginId);
}

function isMainSession(session) {
  return session?.role === "main_partner" || session?.canManageAll === true;
}

function ensureMainFlags(account) {
  if (!account) return account;
  if (isMainRole(account)) {
    return {
      ...account,
      role: "main_partner",
      isMain: true
    };
  }
  return {
    ...account,
    role: "partner",
    isMain: false
  };
}

function normalizePartnerProfile(partnerId, existing, payload = {}) {
  const base = { ...PARTNER_DEFAULTS, ...existing, id: partnerId, partnerId, type: "partner" };
  const patch = {};

  if (payload.name != null) patch.name = clean(payload.name) || base.name;
  if (payload.displayName != null) patch.name = clean(payload.displayName) || base.name;
  if (payload.partnerId != null) patch.partnerId = clean(payload.partnerId) || base.partnerId;
  if (payload.username != null) patch.username = clean(payload.username) || base.username || base.partnerId;
  if (payload.phone != null) patch.phone = clean(payload.phone);
  if (payload.category != null) patch.category = clean(payload.category) || base.category;
  if (payload.age != null) patch.age = Math.max(18, Math.min(99, toNumber(payload.age, base.age)));
  if (payload.gender != null) patch.gender = clean(payload.gender) || base.gender;
  if (payload.city != null) patch.city = clean(payload.city) || base.city;
  if (payload.location != null) patch.location = clean(payload.location) || patch.city || base.location;
  if (payload.profession != null) patch.profession = clean(payload.profession) || base.profession;
  if (payload.bio != null) patch.bio = clean(payload.bio) || base.bio;
  if (payload.welcomeMessage != null) patch.welcomeMessage = clean(payload.welcomeMessage) || base.welcomeMessage;
  if (payload.firstReply != null) patch.firstReply = clean(payload.firstReply) || base.firstReply;
  if (payload.secondReply != null) patch.secondReply = clean(payload.secondReply) || base.secondReply;
  if (payload.interests != null) patch.interests = cleanList(payload.interests, MAX_INTERESTS);
  if (payload.photos != null) patch.photos = cleanList(payload.photos, MAX_PHOTOS);
  if (payload.galleryPhotos != null) patch.galleryPhotos = cleanList(payload.galleryPhotos, MAX_PHOTOS);
  if (payload.videos != null) patch.videos = cleanList(payload.videos, MAX_VIDEOS);

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

  const merged = { ...base, ...patch };
  const photos = cleanList(merged.photos, MAX_PHOTOS);
  const gallery = cleanList(merged.galleryPhotos?.length ? merged.galleryPhotos : photos, MAX_PHOTOS);
  return {
    ...merged,
    photos,
    galleryPhotos: gallery,
    videos: cleanList(merged.videos, MAX_VIDEOS),
    updatedAt: new Date().toISOString()
  };
}

function serializePartner(profile, account) {
  return {
    ...profile,
    account: maskAccount(account)
  };
}

function normalizeAccount(existing, payload = {}) {
  const loginId = clean(payload.loginId || existing?.loginId || payload.username);
  const partnerId = clean(payload.partnerId || existing?.partnerId || `partner_${slugify(loginId)}`);
  const password = String(payload.password || payload.temporaryAccessCode || existing?.password || existing?.temporaryAccessCode || "");
  return {
    ...existing,
    id: clean(existing?.id || payload.id || partnerId),
    partnerId,
    loginId,
    displayName: clean(payload.displayName || payload.name || existing?.displayName || loginId || "Partner"),
    phone: clean(payload.phone || existing?.phone),
    role: payload.role || existing?.role || "partner",
    parentAccountId: payload.parentAccountId ?? existing?.parentAccountId ?? null,
    active: toBoolean(payload.active, existing?.active !== false),
    isMain: toBoolean(payload.isMain, existing?.isMain === true),
    password,
    temporaryAccessCode: password
  };
}

async function listPartnerAccounts() {
  let items = [];
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts").limit(1000).get();
      items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {}
  }
  const localExists = await hasLocalResource("partnerAccounts");
  if (!items.length) items = await listLocalResource("partnerAccounts");
  if (!items.length && !localExists) {
    const fallback = findPartnerAccountByIdFromMemory(`partner_${slugify(env.defaultPartnerLoginId)}`);
    if (fallback) items = [fallback];
  }
  return items.map((item) => ensureMainFlags(item));
}

async function listPartnerProfiles() {
  let items = [];
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partners").limit(1000).get();
      items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {}
  }
  if (!items.length) items = await listLocalResource("partners");
  return items;
}

async function findPartnerAccountByLogin(loginId, password) {
  const localMemory = findPartnerAccountFromMemory(loginId, password);
  if (localMemory) return { source: "memory", account: ensureMainFlags(localMemory) };

  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts")
        .where("active", "==", true)
        .limit(1000)
        .get();
      const account = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((item) =>
          toKey(item.loginId) === toKey(loginId) &&
          clean(item.password || item.temporaryAccessCode || "") === clean(password)
        );
      if (account) {
        const next = ensureMainFlags(account);
        upsertCredentialResource("partnerAccounts", next);
        return { source: "firestore", account: next };
      }
    } catch {}
  }

  const localList = await listLocalResource("partnerAccounts");
  const local = localList.find((item) =>
    item.active !== false &&
    toKey(item.loginId) === toKey(loginId) &&
    clean(item.password || item.temporaryAccessCode || "") === clean(password)
  );
  if (local) {
    const next = ensureMainFlags(local);
    upsertCredentialResource("partnerAccounts", next);
    return { source: "local", account: next };
  }
  if (
    env.defaultPartnerLoginId &&
    env.defaultPartnerPassword &&
    toKey(loginId) === toKey(env.defaultPartnerLoginId) &&
    clean(password) === clean(env.defaultPartnerPassword)
  ) {
    const fallback = ensureMainFlags({
      id: `partner_${slugify(env.defaultPartnerLoginId)}`,
      partnerId: `partner_${slugify(env.defaultPartnerLoginId)}`,
      loginId: env.defaultPartnerLoginId,
      displayName: "Main Partner",
      role: "main_partner",
      isMain: true,
      active: true,
      password: env.defaultPartnerPassword,
      temporaryAccessCode: env.defaultPartnerPassword
    });
    upsertCredentialResource("partnerAccounts", fallback);
    return { source: "env", account: fallback };
  }
  return { source: "none", account: null };
}

async function findPartnerAccountById(accountId) {
  const memory = findPartnerAccountByIdFromMemory(accountId);
  if (memory) return ensureMainFlags(memory);

  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts").doc(accountId).get();
      if (snap.exists) {
        const account = ensureMainFlags({ id: snap.id, ...snap.data() });
        upsertCredentialResource("partnerAccounts", account);
        return account;
      }
    } catch {}
  }

  const local = await getLocalResource("partnerAccounts", accountId);
  if (local) {
    const next = ensureMainFlags(local);
    upsertCredentialResource("partnerAccounts", next);
    return next;
  }
  return null;
}

async function findProfileById(partnerId) {
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partners").doc(partnerId).get();
      if (snap.exists) return { id: snap.id, ...snap.data() };
    } catch {}
  }
  return getLocalResource("partners", partnerId);
}

async function loadOrCreatePartnerProfile(partnerId, account = null) {
  const existing = await findProfileById(partnerId);
  if (existing) return existing;
  const fresh = normalizePartnerProfile(partnerId, null, {
    name: account?.displayName || account?.loginId || PARTNER_DEFAULTS.name,
    username: account?.loginId,
    phone: account?.phone
  });
  await savePartnerProfile(partnerId, { ...fresh, createdAt: new Date().toISOString() });
  return fresh;
}

async function savePartnerProfile(partnerId, profile) {
  const now = new Date().toISOString();
  const next = { ...profile, id: partnerId, partnerId, updatedAt: now };
  if (!hasFirestoreCredentials && !shouldUseLocalFallback()) {
    throw databaseError();
  }
  if (hasFirestoreCredentials) {
    try {
      await db.collection("partners").doc(partnerId).set({
        ...next,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      if (!shouldUseLocalFallback()) throw databaseError();
    }
  }
  await upsertLocalResource("partners", next);
  return next;
}

async function savePartnerAccount(account) {
  const now = new Date().toISOString();
  const next = ensureMainFlags({ ...account, updatedAt: now });
  if (!hasFirestoreCredentials && !shouldUseLocalFallback()) {
    throw databaseError();
  }
  if (hasFirestoreCredentials) {
    try {
      await db.collection("partnerAccounts").doc(next.id).set({
        ...next,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      if (!shouldUseLocalFallback()) throw databaseError();
    }
  }
  await upsertLocalResource("partnerAccounts", next);
  upsertCredentialResource("partnerAccounts", next);
  return next;
}

function canManagePartner(session, targetPartnerId) {
  if (isMainSession(session)) return true;
  return clean(session?.partnerId) === clean(targetPartnerId);
}

async function findLinkedAccountByPartnerId(partnerId) {
  const accounts = await listPartnerAccounts();
  return accounts.find((item) => clean(item.partnerId || item.id) === clean(partnerId)) || null;
}

function buildPartnerToken(account, loginIdOverride = "") {
  const partnerId = clean(account.partnerId || account.id || `partner_${account.loginId}`);
  const loginId = clean(loginIdOverride || account.loginId);
  const main = isMainRole(account);
  const token = issuePartnerToken({
    role: main ? "main_partner" : "partner",
    canManageAll: main,
    accountId: account.id,
    partnerId,
    loginId,
    mainAccountId: main ? account.id : clean(account.parentAccountId),
    parentAccountId: clean(account.parentAccountId)
  });
  return {
    token,
    session: {
      role: main ? "main_partner" : "partner",
      canManageAll: main,
      partnerId,
      accountId: account.id,
      loginId,
      mainAccountId: main ? account.id : clean(account.parentAccountId),
      parentAccountId: clean(account.parentAccountId)
    }
  };
}

export async function partnerLogin(req, res) {
  const loginId = clean(req.body?.id || req.body?.loginId);
  const password = clean(req.body?.password);
  if (!loginId || !password) {
    return res.status(400).json({ message: "ID and password required." });
  }

  const { account } = await findPartnerAccountByLogin(loginId, password);
  if (!account) return res.status(401).json({ message: "Partner ID/password galat hai." });

  const nextAccount = await savePartnerAccount(account);
  const partnerId = clean(nextAccount.partnerId || nextAccount.id || `partner_${loginId}`);
  const profile = await loadOrCreatePartnerProfile(partnerId, nextAccount);
  const signed = buildPartnerToken(nextAccount, loginId);

  res.json({
    ok: true,
    token: signed.token,
    session: signed.session,
    profile,
    account: maskAccount(nextAccount)
  });
}

export async function partnerSubLogin(req, res) {
  return partnerLogin(req, res);
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

export async function listManagedPartnerProfiles(req, res) {
  const session = req.partner || {};
  const profiles = await listPartnerProfiles();
  const accounts = await listPartnerAccounts();
  const accountByPartnerId = new Map(accounts.map((item) => [clean(item.partnerId || item.id), item]));

  if (!isMainSession(session)) {
    const ownId = clean(session.partnerId);
    const own = profiles.find((item) => clean(item.id) === ownId);
    return res.json({
      items: own ? [serializePartner(own, accountByPartnerId.get(ownId) || null)] : []
    });
  }

  const items = profiles
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))
    .map((profile) => serializePartner(profile, accountByPartnerId.get(clean(profile.id)) || null));

  return res.json({ items });
}

export async function getManagedPartnerProfile(req, res) {
  const targetId = clean(req.params?.id);
  if (!targetId) return res.status(400).json({ message: "Partner ID required." });
  if (!canManagePartner(req.partner, targetId)) return res.status(403).json({ message: "Access denied." });

  const profile = await loadOrCreatePartnerProfile(targetId);
  const account = await findLinkedAccountByPartnerId(targetId);
  return res.json({ item: serializePartner(profile, account) });
}

export async function createPartnerProfile(req, res) {
  if (!isMainSession(req.partner)) return res.status(403).json({ message: "Only main partner can add profiles." });

  const loginId = clean(req.body?.loginId || req.body?.username);
  const password = String(req.body?.password || "");
  const name = clean(req.body?.name || req.body?.displayName || loginId);
  if (!loginId || !password || password.length < 6) {
    return res.status(400).json({ message: "Login ID and password (min 6 chars) required." });
  }

  const accounts = await listPartnerAccounts();
  if (accounts.some((item) => toKey(item.loginId) === toKey(loginId))) {
    return res.status(409).json({ message: "Partner login ID already exists." });
  }

  const profiles = await listPartnerProfiles();
  let partnerId = clean(req.body?.partnerId || req.body?.id);
  if (!partnerId) partnerId = `partner_${slugify(loginId)}`;
  while (profiles.some((item) => clean(item.id) === partnerId)) {
    partnerId = `${partnerId}_${Math.floor(Math.random() * 1000)}`;
  }

  const account = normalizeAccount(null, {
    id: partnerId,
    partnerId,
    loginId,
    password,
    displayName: name,
    phone: req.body?.phone,
    role: "partner",
    isMain: false,
    parentAccountId: clean(req.partner?.accountId),
    active: true
  });
  await savePartnerAccount(account);

  const profile = normalizePartnerProfile(partnerId, null, {
    ...req.body,
    name,
    username: loginId,
    partnerId,
    phone: req.body?.phone,
    photos: cleanList(req.body?.photos, MAX_PHOTOS),
    galleryPhotos: cleanList(req.body?.galleryPhotos || req.body?.photos, MAX_PHOTOS),
    videos: cleanList(req.body?.videos, MAX_VIDEOS),
    active: true
  });
  const saved = await savePartnerProfile(partnerId, {
    ...profile,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ ok: true, item: serializePartner(saved, account) });
}

export async function replacePartnerProfile(req, res) {
  const targetId = clean(req.params?.id);
  if (!targetId) return res.status(400).json({ message: "Partner ID required." });
  if (!canManagePartner(req.partner, targetId)) return res.status(403).json({ message: "Access denied." });

  const existing = await loadOrCreatePartnerProfile(targetId);
  const next = normalizePartnerProfile(targetId, existing, req.body || {});
  const saved = await savePartnerProfile(targetId, next);

  const linkedAccount = await findLinkedAccountByPartnerId(targetId);
  if (linkedAccount) {
    const patch = {
      ...linkedAccount,
      displayName: clean(req.body?.name || req.body?.displayName || linkedAccount.displayName),
      phone: clean(req.body?.phone || linkedAccount.phone),
      active: req.body?.active != null ? toBoolean(req.body?.active, linkedAccount.active !== false) : linkedAccount.active
    };
    if (isMainSession(req.partner) && req.body?.loginId) patch.loginId = clean(req.body.loginId);
    if (isMainSession(req.partner) && req.body?.password) {
      patch.password = String(req.body.password);
      patch.temporaryAccessCode = String(req.body.password);
    }
    await savePartnerAccount(patch);
  }

  const account = await findLinkedAccountByPartnerId(targetId);
  return res.json({ ok: true, item: serializePartner(saved, account) });
}

export async function updatePartnerProfile(req, res) {
  const partnerId = clean(req.partner?.partnerId);
  if (!partnerId) return res.status(401).json({ message: "Invalid partner session." });
  const existing = await loadOrCreatePartnerProfile(partnerId);
  const next = normalizePartnerProfile(partnerId, existing, req.body || {});
  const saved = await savePartnerProfile(partnerId, next);
  const account = await findLinkedAccountByPartnerId(partnerId);
  res.json({ ok: true, profile: saved, account: maskAccount(account) });
}

export async function setPartnerProfileStatus(req, res) {
  if (!isMainSession(req.partner)) return res.status(403).json({ message: "Only main partner can update status." });
  const targetId = clean(req.params?.id);
  if (!targetId) return res.status(400).json({ message: "Partner ID required." });
  const existing = await loadOrCreatePartnerProfile(targetId);
  const next = normalizePartnerProfile(targetId, existing, { active: req.body?.active });
  const saved = await savePartnerProfile(targetId, next);
  const linkedAccount = await findLinkedAccountByPartnerId(targetId);
  if (linkedAccount) {
    await savePartnerAccount({
      ...linkedAccount,
      active: next.active !== false
    });
  }
  const account = await findLinkedAccountByPartnerId(targetId);
  return res.json({ ok: true, item: serializePartner(saved, account) });
}

export async function deletePartnerProfile(req, res) {
  if (!isMainSession(req.partner)) return res.status(403).json({ message: "Only main partner can delete profiles." });
  const targetId = clean(req.params?.id);
  if (!targetId) return res.status(400).json({ message: "Partner ID required." });
  const existing = await loadOrCreatePartnerProfile(targetId);
  const saved = await savePartnerProfile(targetId, {
    ...existing,
    active: false,
    showInDiscovery: false,
    showInMatches: false,
    deletedAt: new Date().toISOString()
  });
  const linkedAccount = await findLinkedAccountByPartnerId(targetId);
  if (linkedAccount) {
    await savePartnerAccount({
      ...linkedAccount,
      active: false
    });
  }
  return res.json({ ok: true, item: saved });
}

export async function attachPartnerMedia(req, res) {
  const targetId = clean(req.params?.id);
  if (!targetId) return res.status(400).json({ message: "Partner ID required." });
  if (!canManagePartner(req.partner, targetId)) return res.status(403).json({ message: "Access denied." });

  const kind = clean(req.body?.kind || "photos").toLowerCase();
  const isVideo = kind === "videos" || kind === "video";
  const key = isVideo ? "videos" : "photos";
  const limit = isVideo ? MAX_VIDEOS : MAX_PHOTOS;
  const incoming = cleanList(req.body?.urls?.length ? req.body.urls : [req.body?.url], limit);
  if (!incoming.length) return res.status(400).json({ message: "Media URL required." });

  const existing = await loadOrCreatePartnerProfile(targetId);
  const prev = cleanList(existing[key], limit);
  const nextMedia = [...prev, ...incoming].slice(0, limit);
  const updated = normalizePartnerProfile(targetId, existing, {
    [key]: nextMedia,
    galleryPhotos: key === "photos" ? nextMedia : existing.galleryPhotos
  });
  const saved = await savePartnerProfile(targetId, updated);
  const account = await findLinkedAccountByPartnerId(targetId);
  return res.json({ ok: true, item: serializePartner(saved, account) });
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

  const allAccounts = await listPartnerAccounts();
  const loginConflict = allAccounts.find((item) => item.id !== account.id && toKey(item.loginId) === toKey(newLoginId));
  if (loginConflict) return res.status(409).json({ message: "This login ID is already in use." });

  const next = ensureMainFlags({
    ...account,
    loginId: newLoginId,
    temporaryAccessCode: newPassword,
    password: newPassword
  });
  await savePartnerAccount(next);

  const signed = buildPartnerToken(next, next.loginId);
  res.json({
    ok: true,
    token: signed.token,
    session: signed.session,
    account: maskAccount(next)
  });
}
