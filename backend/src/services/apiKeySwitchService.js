import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { listLocalResource, upsertLocalResource } from "./localDataStore.js";

export async function getActiveApiKey(providerName) {
  if (!hasFirestoreCredentials) {
    const items = (await listLocalResource("apiKeys"))
      .filter((item) => item.providerName === providerName && item.active !== false)
      .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99));
    for (const item of items) {
      const daily = Number(item.dailyLimit || 0);
      const monthly = Number(item.monthlyLimit || 0);
      const used = Number(item.usedCount || 0);
      const limit = Math.min(...[daily, monthly].filter(Boolean));
      if (!limit || used < limit) return item;
    }
    const recyclable = items.find((item) => item.autoRecycleOnExhaustion !== false);
    if (recyclable) {
      await upsertLocalResource("apiKeys", { ...recyclable, usedCount: 0, recycledAt: new Date().toISOString() });
      return { ...recyclable, usedCount: 0, recycled: true };
    }
    return null;
  }
  let snap;
  try {
    snap = await db.collection("apiKeys")
      .where("providerName", "==", providerName)
      .where("active", "==", true)
      .get();
  } catch {
    return null;
  }

  const items = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99));
  for (const item of items) {
    const daily = Number(item.dailyLimit || 0);
    const monthly = Number(item.monthlyLimit || 0);
    const used = Number(item.usedCount || 0);
    const limit = Math.min(...[daily, monthly].filter(Boolean));
    if (!limit || used < limit) return item;
  }
  const recyclable = items.find((item) => item.autoRecycleOnExhaustion);
  if (recyclable) {
    await db.collection("apiKeys").doc(recyclable.id).set({
      usedCount: 0,
      recycledAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
    return { ...recyclable, usedCount: 0, recycled: true };
  }
  return null;
}

export async function markApiKeyUsed(id) {
  if (!id) return;
  if (!hasFirestoreCredentials) {
    const item = (await listLocalResource("apiKeys")).find((entry) => entry.id === id);
    if (item) await upsertLocalResource("apiKeys", { ...item, usedCount: Number(item.usedCount || 0) + 1, lastUsedTime: new Date().toISOString() });
    return;
  }
  await db.collection("apiKeys").doc(id).set({
    usedCount: firebaseAdmin.firestore.FieldValue.increment(1),
    lastUsedTime: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function markApiKeyError(id) {
  if (!id) return;
  if (!hasFirestoreCredentials) {
    const item = (await listLocalResource("apiKeys")).find((entry) => entry.id === id);
    if (item) await upsertLocalResource("apiKeys", { ...item, errorCount: Number(item.errorCount || 0) + 1, lastErrorTime: new Date().toISOString() });
    return;
  }
  await db.collection("apiKeys").doc(id).set({
    errorCount: firebaseAdmin.firestore.FieldValue.increment(1),
    lastErrorTime: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}
