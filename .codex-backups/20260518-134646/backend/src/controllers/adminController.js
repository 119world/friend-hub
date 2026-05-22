import { db, firebaseAdmin } from "../config/firebaseAdmin.js";
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
  reports: "reports",
  notifications: "notifications"
};

export async function dashboard(req, res) {
  const payments = await db.collection("payments").where("status", "==", "paid").get();
  const totals = { todayReceived: 0, weekReceived: 0, monthReceived: 0, yearReceived: 0, lifetimeReceived: 0 };
  for (const doc of payments.docs) {
    const p = doc.data();
    const amount = Number(p.amount || 0);
    const date = p.paidAt?.toDate?.() || p.createdAt?.toDate?.() || new Date(0);
    totals.lifetimeReceived += amount;
    if (date >= startOfDay()) totals.todayReceived += amount;
    if (date >= startOfWeek()) totals.weekReceived += amount;
    if (date >= startOfMonth()) totals.monthReceived += amount;
    if (date >= startOfYear()) totals.yearReceived += amount;
  }
  const bankSnap = await db.collection("bankAccounts").where("active", "==", true).orderBy("priority", "asc").limit(1).get();
  const bank = bankSnap.docs[0]?.data();
  res.json({
    ...totals,
    remainingLimit: bank ? Number(bank.dailyLimit || 0) - Number(bank.usedAmount || 0) : 0,
    activePaymentAccount: bank?.upiId || bank?.bankName || "Not set"
  });
}

export async function listResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  const snap = await db.collection(name).limit(100).get();
  const items = snap.docs.map((doc) => {
    const data = { id: doc.id, ...doc.data() };
    if (name === "apiKeys" && data.secretKey) data.secretKey = "stored in backend";
    return data;
  });
  res.json({ items });
}

export async function createResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  const payload = {
    ...req.body,
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  };
  if (name === "apiKeys" && payload.secretKey) payload.secretKeyStoredInBackend = true;
  const explicitId = typeof payload.id === "string" && payload.id.trim() ? payload.id.trim() : null;
  if (explicitId) delete payload.id;
  const ref = explicitId ? db.collection(name).doc(explicitId) : db.collection(name).doc();
  await ref.set(payload, { merge: true });
  const item = { id: ref.id, ...payload };
  if (name === "apiKeys" && item.secretKey) item.secretKey = "stored in backend";
  res.status(201).json({ item });
}

export async function updateResource(req, res) {
  const name = collectionMap[req.params.resource];
  if (!name) return res.status(404).json({ message: "Unknown resource" });
  await db.collection(name).doc(req.params.id).set({
    ...req.body,
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  res.json({ ok: true });
}
