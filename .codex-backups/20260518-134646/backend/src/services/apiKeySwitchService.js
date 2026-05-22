import { db, firebaseAdmin } from "../config/firebaseAdmin.js";

export async function getActiveApiKey(providerName) {
  const snap = await db.collection("apiKeys")
    .where("providerName", "==", providerName)
    .where("active", "==", true)
    .orderBy("priority", "asc")
    .get();

  for (const doc of snap.docs) {
    const item = { id: doc.id, ...doc.data() };
    const daily = Number(item.dailyLimit || 0);
    const monthly = Number(item.monthlyLimit || 0);
    const used = Number(item.usedCount || 0);
    const limit = Math.min(...[daily, monthly].filter(Boolean));
    if (!limit || used < limit) return item;
  }
  return null;
}

export async function markApiKeyUsed(id) {
  if (!id) return;
  await db.collection("apiKeys").doc(id).set({
    usedCount: firebaseAdmin.firestore.FieldValue.increment(1),
    lastUsedTime: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function markApiKeyError(id) {
  if (!id) return;
  await db.collection("apiKeys").doc(id).set({
    errorCount: firebaseAdmin.firestore.FieldValue.increment(1),
    lastErrorTime: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}
