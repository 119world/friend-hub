import { db, firebaseAdmin } from "../config/firebaseAdmin.js";

export async function startVoicePreview(userId, targetId) {
  const settingsSnap = await db.collection("appSettings").doc("voice").get();
  const freePreviewSeconds = settingsSnap.data()?.freePreviewSeconds || 20;
  const ratePerMinute = settingsSnap.data()?.ratePerMinute || 20;
  return {
    userId,
    targetId,
    freePreviewSeconds,
    ratePerMinute
  };
}

export async function deductVoiceDiamonds(userId, seconds, ratePerMinute = 20) {
  const diamonds = Math.ceil((seconds / 60) * ratePerMinute);
  await db.collection("diamondWallets").doc(userId).set({
    diamonds: firebaseAdmin.firestore.FieldValue.increment(-diamonds),
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await db.collection("users").doc(userId).set({
    diamonds: firebaseAdmin.firestore.FieldValue.increment(-diamonds)
  }, { merge: true });
  return { diamondsDeducted: diamonds };
}
