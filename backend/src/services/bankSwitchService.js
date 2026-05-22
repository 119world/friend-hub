import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { listLocalResource, upsertLocalResource } from "./localDataStore.js";

function accountWithinLimit(item, amount) {
  const daily = Number(item.dailyLimit || 0);
  const weekly = Number(item.weeklyLimit || 0);
  const monthly = Number(item.monthlyLimit || 0);
  const yearly = Number(item.yearlyLimit || 0);
  const used = Number(item.usedAmount || 0);
  const limits = [daily, weekly, monthly, yearly].filter((x) => x > 0);
  const maxAllowed = limits.length ? Math.min(...limits) : Number.MAX_SAFE_INTEGER;
  return used + amount <= maxAllowed;
}

async function listActiveAccounts(collectionName) {
  if (!hasFirestoreCredentials) {
    return (await listLocalResource(collectionName))
      .filter((item) => item.active !== false)
      .map((item) => ({ ...item, sourceCollection: collectionName }))
      .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99));
  }
  try {
    const snap = await db.collection(collectionName).where("active", "==", true).get();
    return snap.docs
      .map((doc) => ({ id: doc.id, sourceCollection: collectionName, ...doc.data() }))
      .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99));
  } catch {
    return [];
  }
}

export async function getActivePaymentAccount(amount = 0) {
  const accounts = [
    ...(await listActiveAccounts("paymentAccounts")),
    ...(await listActiveAccounts("bankAccounts"))
  ];

  for (const item of accounts) {
    if (accountWithinLimit(item, amount)) return item;
  }

  const recyclable = accounts.find((item) => item.autoRecycleOnExhaustion !== false);
  if (recyclable) {
    if (!hasFirestoreCredentials) {
      await upsertLocalResource(recyclable.sourceCollection, { ...recyclable, usedAmount: 0, recycledAt: new Date().toISOString() });
      return { ...recyclable, usedAmount: 0, recycled: true };
    }
    try {
      await db.collection(recyclable.sourceCollection).doc(recyclable.id).set({
        usedAmount: 0,
        recycledAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch {}
    return { ...recyclable, usedAmount: 0, recycled: true };
  }
  return null;
}

export async function markAccountUsed(accountId, amount) {
  if (!accountId) return;
  const collections = ["paymentAccounts", "bankAccounts"];
  if (!hasFirestoreCredentials) {
    for (const name of collections) {
      const item = (await listLocalResource(name)).find((entry) => entry.id === accountId);
      if (item) {
        await upsertLocalResource(name, {
          ...item,
          usedAmount: Number(item.usedAmount || 0) + Number(amount || 0),
          lastUsedAt: new Date().toISOString()
        });
        return;
      }
    }
    return;
  }
  for (const name of collections) {
    const ref = db.collection(name).doc(accountId);
    const snap = await ref.get().catch(() => null);
    if (snap?.exists) {
      await ref.set({
        usedAmount: firebaseAdmin.firestore.FieldValue.increment(amount),
        lastUsedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return;
    }
  }
}
