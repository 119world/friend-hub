import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { getLocalResource, upsertLocalResource } from "../services/localDataStore.js";

function nowValue() {
  return hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
}

function clientTimestamp() {
  return new Date().toISOString();
}

function defaultProfile(user) {
  const timestamp = nowValue();
  return {
    uid: user.uid,
    name: user.name || user.displayName || user.email?.split("@")[0] || "Friend Hub User",
    age: 21,
    gender: "Female",
    city: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    religion: "",
    bio: "Here to meet kind people.",
    interests: ["Friendship", "Music"],
    photos: user.picture ? [user.picture] : [],
    videos: [],
    role: "user",
    diamonds: 0,
    referralCode: String(user.uid).slice(0, 8).toUpperCase(),
    referralCount: 0,
    online: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function toStringList(value, limit) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  return items.map((item) => String(item).trim()).filter(Boolean).slice(0, limit);
}

function numberOrFallback(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function sanitizeProfilePatch(body = {}) {
  const patch = {};
  const stringFields = ["name", "gender", "city", "profession", "bio", "lookingFor", "religion"];
  for (const field of stringFields) {
    if (field in body) patch[field] = String(body[field] || "").trim();
  }
  if ("age" in body) patch.age = numberOrFallback(body.age, 21);
  if ("lat" in body) patch.lat = numberOrFallback(body.lat, 28.6139);
  if ("lng" in body) patch.lng = numberOrFallback(body.lng, 77.209);
  if ("diamonds" in body) patch.diamonds = numberOrFallback(body.diamonds, 0);
  if ("minutes" in body) patch.minutes = numberOrFallback(body.minutes, 0);
  if ("online" in body) patch.online = body.online === true || body.online === "true";
  if ("interests" in body) patch.interests = toStringList(body.interests, 12);
  if ("photos" in body) patch.photos = toStringList(body.photos, 6);
  if ("videos" in body) patch.videos = toStringList(body.videos, 2);
  return patch;
}

async function getStoredProfile(uid) {
  if (!hasFirestoreCredentials) return getLocalResource("users", uid);
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function saveStoredProfile(uid, profile) {
  if (!hasFirestoreCredentials) {
    const current = await getLocalResource("users", uid);
    const item = {
      ...(current || {}),
      ...profile,
      id: uid,
      uid,
      updatedAt: clientTimestamp()
    };
    await upsertLocalResource("users", item);
    return item;
  }
  await db.collection("users").doc(uid).set(profile, { merge: true });
  const fresh = await db.collection("users").doc(uid).get();
  return { id: fresh.id, ...fresh.data() };
}

export async function getMyProfile(req, res) {
  const uid = req.user.uid;
  const existing = await getStoredProfile(uid);
  if (existing) {
    const updated = await saveStoredProfile(uid, { online: true, updatedAt: nowValue() });
    return res.json({ profile: { ...existing, ...updated, id: uid, uid }, demo: !hasFirestoreCredentials });
  }

  const created = await saveStoredProfile(uid, defaultProfile(req.user));
  return res.status(201).json({ profile: created, created: true, demo: !hasFirestoreCredentials });
}

export async function updateMyProfile(req, res) {
  const uid = req.user.uid;
  const existing = await getStoredProfile(uid);
  const base = existing || defaultProfile(req.user);
  const patch = sanitizeProfilePatch(req.body);
  const saved = await saveStoredProfile(uid, {
    ...base,
    ...patch,
    id: uid,
    uid,
    online: true,
    updatedAt: nowValue(),
    createdAt: base.createdAt || nowValue()
  });
  res.json({ ok: true, profile: saved, demo: !hasFirestoreCredentials });
}
