import { db, firebaseAdmin } from "../config/firebaseAdmin.js";

export async function getActivePaymentAccount(amount = 0) {
  const snap = await db.collection("bankAccounts").where("active", "==", true).orderBy("priority", "asc").get();
  for (const doc of snap.docs) {
    const item = { id: doc.id, ...doc.data() };
    const daily = Number(item.dailyLimit || 0);
    const weekly = Number(item.weeklyLimit || 0);
    const monthly = Number(item.monthlyLimit || 0);
    const yearly = Number(item.yearlyLimit || 0);
    const used = Number(item.usedAmount || 0);
    const limits = [daily, weekly, monthly, yearly].filter((x) => x > 0);
    const maxAllowed = limits.length ? Math.min(...limits) : Number.MAX_SAFE_INTEGER;
    if (used + amount <= maxAllowed) return item;
  }
  return null;
}

export async function markAccountUsed(accountId, amount) {
  if (!accountId) return;
  await db.collection("bankAccounts").doc(accountId).set({
    usedAmount: firebaseAdmin.firestore.FieldValue.increment(amount)
  }, { merge: true });
}
