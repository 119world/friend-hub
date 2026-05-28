import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { listCredentialResource, upsertCredentialResource } from "../services/credentialStore.js";
import { listLocalResource, upsertLocalResource } from "../services/localDataStore.js";
import { creditWallet } from "../services/paymentService.js";
import { startOfDay, startOfMonth, startOfWeek, startOfYear } from "../utils/timeWindow.js";

const collectionMap = {
  users: "users",
  partners: "partners",
  aiBots: "aiBots",
  chats: "chats",
  payments: "payments",
  plans: "plans",
  bankAccounts: "bankAccounts",
  apiKeys: "apiKeys",
  replyTemplates: "replyTemplates",
  appSettings: "appSettings",
  mediaAssets: "mediaAssets",
  offers: "offers",
  subscriptions: "subscriptions",
  callSessions: "callSessions",
  paymentAccounts: "paymentAccounts",
  autoReplies: "autoReplies",
  adminAccounts: "adminAccounts",
  partnerAccounts: "partnerAccounts",
  referralRules: "referralRules",
  refundRequests: "refundRequests",
  reports: "reports",
  notifications: "notifications"
};

const arrayFields = new Set(["photos", "videos", "galleryPhotos", "interests", "keywords", "banners"]);
const numberFields = new Set([
  "age",
  "price",
  "originalPrice",
  "discount",
  "diamonds",
  "minutes",
  "chatPrice",
  "voiceCallPrice",
  "dailyLimit",
  "weeklyLimit",
  "monthlyLimit",
  "yearlyLimit",
  "usedAmount",
  "remainingLimit",
  "priority",
  "freeReplyLimit",
  "replyLimit",
  "delayMs",
  "ratePerMinute",
  "freePreviewSeconds",
  "autoPayAmount",
  "renewEveryDays",
  "distanceKm",
  "lat",
  "lng",
  "latitude",
  "longitude",
  "referralCount",
  "requiredReferrals",
  "bonusDiamonds"
]);
const booleanFields = new Set(["active", "verified", "online", "autoPay", "subscription", "subscriptionEnabled", "manualFailover", "rechargeTrigger", "offerTrigger", "showInDiscovery", "showInMatches", "allowAutoContact", "autoRecycleOnExhaustion", "maintenanceMode"]);

function normalizeValue(key, value) {
  if (value === "") return null;
  if (booleanFields.has(key)) {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
  }
  if (numberFields.has(key)) {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
  }
  if (arrayFields.has(key)) {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch {}
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (key.endsWith("Config") && typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizePayload(resource, body) {
  const payload = {};
  for (const [key, value] of Object.entries(body || {})) {
    payload[key] = normalizeValue(key, value);
  }
  if (resource === "partners") {
    payload.photos = (payload.photos || []).slice(0, 7);
    payload.videos = (payload.videos || []).slice(0, 3);
    payload.type = "partner";
    payload.active = payload.active !== false;
    payload.showInDiscovery = payload.showInDiscovery !== false;
    payload.showInMatches = payload.showInMatches !== false;
    payload.allowAutoContact = payload.allowAutoContact !== false;
  }
  if (resource === "aiBots") {
    payload.photos = (payload.photos || payload.galleryPhotos || []).slice(0, 7);
    payload.galleryPhotos = (payload.galleryPhotos || payload.photos || []).slice(0, 7);
    payload.videos = (payload.videos || []).slice(0, 3);
    payload.type = "bot";
    payload.active = payload.active !== false;
    payload.showInDiscovery = payload.showInDiscovery !== false;
    payload.showInMatches = payload.showInMatches !== false;
    payload.allowAutoContact = payload.allowAutoContact !== false;
  }
  if (resource === "plans") {
    payload.active = payload.active !== false;
    payload.discount = payload.originalPrice && payload.price
      ? Math.max(0, Math.round(((payload.originalPrice - payload.price) / payload.originalPrice) * 100))
      : Number(payload.discount || 0);
  }
  if (resource === "mediaAssets") {
    payload.active = payload.active !== false;
  }
  if (resource === "paymentAccounts") {
    payload.active = payload.active !== false;
    payload.gateway = payload.gateway || "razorpay";
    payload.autoRecycleOnExhaustion = payload.autoRecycleOnExhaustion !== false;
  }
  if (resource === "bankAccounts") {
    payload.active = payload.active !== false;
    payload.autoRecycleOnExhaustion = payload.autoRecycleOnExhaustion !== false;
  }
  if (resource === "apiKeys") {
    payload.active = payload.active !== false;
    payload.autoRecycleOnExhaustion = payload.autoRecycleOnExhaustion !== false;
  }
  return payload;
}

function maskSensitive(name, data) {
  const copy = { ...data };
  if (name === "apiKeys") {
    if (copy.secretKey) copy.secretKey = "stored in backend";
    if (copy.apiKey) copy.apiKey = `${String(copy.apiKey).slice(0, 6)}...stored`;
  }
  if (name === "paymentAccounts") {
    if (copy.keySecret) copy.keySecret = "stored in backend";
    if (copy.webhookSecret) copy.webhookSecret = "stored in backend";
  }
  if (name === "partnerAccounts" && copy.temporaryAccessCode) copy.temporaryAccessCode = "stored in backend";
  if (name === "adminAccounts" && copy.password) copy.password = "stored in backend";
  return copy;
}

function localDocs(items) {
  return items.map((item) => ({ data: () => item }));
}

function toDate(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : new Date(0));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

async function safeCount(name, buildQuery = (ref) => ref) {
  if (!hasFirestoreCredentials) return (await listLocalResource(name)).length;
  try {
    const snap = await buildQuery(db.collection(name)).count().get();
    return snap.data().count || 0;
  } catch {
    try {
      const snap = await buildQuery(db.collection(name)).limit(1000).get();
      return snap.size;
    } catch {
      return (await listLocalResource(name)).length;
    }
  }
}

export async function dashboard(req, res) {
  const payments = hasFirestoreCredentials
    ? await db.collection("payments").where("status", "==", "paid").get().catch(() => ({ docs: [] }))
    : { docs: localDocs((await listLocalResource("payments")).filter((item) => item.status === "paid")) };
  const totals = { todayReceived: 0, weekReceived: 0, monthReceived: 0, yearReceived: 0, lifetimeReceived: 0 };
  for (const doc of payments.docs) {
    const p = doc.data();
    const amount = Number(p.amount || 0);
    const date = toDate(p.paidAt || p.createdAt);
    totals.lifetimeReceived += amount;
    if (date >= startOfDay()) totals.todayReceived += amount;
    if (date >= startOfWeek()) totals.weekReceived += amount;
    if (date >= startOfMonth()) totals.monthReceived += amount;
    if (date >= startOfYear()) totals.yearReceived += amount;
  }
  const gatewaySnap = hasFirestoreCredentials
    ? await db.collection("paymentAccounts").where("active", "==", true).limit(50).get().catch(() => ({ docs: [] }))
    : { docs: localDocs((await listLocalResource("paymentAccounts")).filter((item) => item.active !== false)) };
  const bankSnap = hasFirestoreCredentials
    ? await db.collection("bankAccounts").where("active", "==", true).limit(50).get().catch(() => ({ docs: [] }))
    : { docs: localDocs((await listLocalResource("bankAccounts")).filter((item) => item.active !== false)) };
  const bank = [...gatewaySnap.docs, ...bankSnap.docs]
    .map((doc) => doc.data())
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))[0];
  const failedPayments = await safeCount("payments", (ref) => ref.where("status", "in", ["failed", "cancelled"]));
  const usersTotal = await safeCount("users");
  const activeUsers = await safeCount("users", (ref) => ref.where("online", "==", true));
  const chatsTotal = await safeCount("chats");
  const callsTotal = await safeCount("callSessions");
  const rechargeCount = await safeCount("payments", (ref) => ref.where("status", "==", "paid"));
  const apiKeySnap = hasFirestoreCredentials
    ? await db.collection("apiKeys").where("active", "==", true).limit(50).get().catch(() => ({ docs: [] }))
    : { docs: localDocs((await listLocalResource("apiKeys")).filter((item) => item.active !== false)) };
  const apiUsage = apiKeySnap.docs.reduce((sum, doc) => sum + Number(doc.data().usedCount || 0), 0);
  res.json({
    ...totals,
    usersTotal,
    activeUsers,
    newUsers: await safeCount("users", (ref) => ref.where("createdAt", ">=", startOfDay())),
    chatsTotal,
    callsTotal,
    rechargeCount,
    failedPayments,
    apiUsage,
    remainingLimit: bank ? Number(bank.dailyLimit || 0) - Number(bank.usedAmount || 0) : 0,
    activePaymentAccount: bank?.label || bank?.upiId || bank?.bankName || bank?.gateway || "Not set"
  });
}

export async function listResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  if (!hasFirestoreCredentials && (name === "adminAccounts" || name === "partnerAccounts")) {
    return res.json({ items: listCredentialResource(name).map((item) => maskSensitive(name, item)), demo: true });
  }
  const snap = hasFirestoreCredentials ? await db.collection(name).limit(100).get().catch(() => null) : null;
  if (!snap) {
    const items = (await listLocalResource(name)).map((item) => maskSensitive(name, item));
    return res.json({ items, demo: true });
  }
  const items = snap.docs.map((doc) => {
    return maskSensitive(name, { id: doc.id, ...doc.data() });
  });
  res.json({ items });
}

export async function createResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  const clean = normalizePayload(name, req.body);
  const now = hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
  const payload = {
    ...clean,
    createdAt: now,
    updatedAt: now
  };
  if (name === "apiKeys" && payload.secretKey) payload.secretKeyStoredInBackend = true;
  if (name === "paymentAccounts" && payload.keySecret) payload.secretKeyStoredInBackend = true;
  const explicitId = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : null;
  if (explicitId) delete payload.id;
  const ref = hasFirestoreCredentials
    ? (explicitId ? db.collection(name).doc(explicitId) : db.collection(name).doc())
    : { id: explicitId || `${name}_${Date.now()}` };
  try {
    if (!hasFirestoreCredentials) throw new Error("Local demo store");
    await ref.set(payload, { merge: true });
    if (name === "adminAccounts" || name === "partnerAccounts") {
      upsertCredentialResource(name, { id: ref.id, ...payload });
    }
  } catch {
    const item = { id: ref.id, ...payload, demoOnly: true };
    if (name === "adminAccounts" || name === "partnerAccounts") {
      upsertCredentialResource(name, item);
    }
    await upsertLocalResource(name, item);
    return res.status(201).json({ item: maskSensitive(name, item), demo: true });
  }
  res.status(201).json({ item: maskSensitive(name, { id: ref.id, ...payload }) });
}

export async function updateResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  const clean = normalizePayload(name, req.body);
  try {
    if (!hasFirestoreCredentials) throw new Error("Local demo store");
    await db.collection(name).doc(req.params.id).set({
      ...clean,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch {
    const items = await listLocalResource(name);
    const index = items.findIndex((item) => item.id === req.params.id);
    if (index >= 0) items[index] = { ...items[index], ...clean, demoOnly: true };
    else items.unshift({ id: req.params.id, ...clean, demoOnly: true });
    if (name === "adminAccounts" || name === "partnerAccounts") {
      upsertCredentialResource(name, { id: req.params.id, ...clean, demoOnly: true });
    }
    await upsertLocalResource(name, items[index >= 0 ? index : 0]);
    return res.json({ ok: true, demo: true });
  }
  res.json({ ok: true });
}

export async function verifyManualPayment(req, res) {
  const paymentId = req.params.id;
  const now = hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
  const current = hasFirestoreCredentials
    ? await db.collection("payments").doc(paymentId).get().then((snap) => (snap.exists ? { id: snap.id, ...snap.data() } : null)).catch(() => null)
    : await listLocalResource("payments").then((items) => items.find((item) => item.id === paymentId || item.orderId === paymentId) || null);

  if (!current) return res.status(404).json({ message: "Payment not found." });
  if (!["manual_pending", "manual_submitted", "demo_created", "created"].includes(current.status)) {
    return res.status(400).json({ message: "Payment is not pending manual verification." });
  }

  const patch = {
    ...current,
    id: current.id || paymentId,
    orderId: current.orderId || paymentId,
    status: "paid",
    paymentId: current.manualTransactionId || req.body?.paymentId || `manual_verified_${Date.now()}`,
    verifiedByAdmin: true,
    verifiedAt: now,
    updatedAt: now
  };

  if (hasFirestoreCredentials) {
    await db.collection("payments").doc(paymentId).set(patch, { merge: true });
  } else {
    await upsertLocalResource("payments", patch);
  }
  await creditWallet(current.userId, current.planId);
  res.json({ ok: true, item: patch });
}
