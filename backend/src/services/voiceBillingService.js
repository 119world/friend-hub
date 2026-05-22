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
  if (!Number.isFinite(diamonds) || diamonds <= 0) return { diamondsDeducted: 0 };
  const walletRef = db.collection("diamondWallets").doc(userId);
  const userRef = db.collection("users").doc(userId);
  await db.runTransaction(async (transaction) => {
    const wallet = await transaction.get(walletRef);
    const user = await transaction.get(userRef);
    const available = Number(wallet.data()?.diamonds ?? user.data()?.diamonds ?? 0);
    if (available < diamonds) {
      const error = new Error("Recharge required");
      error.status = 402;
      throw error;
    }
    transaction.set(walletRef, {
      diamonds: firebaseAdmin.firestore.FieldValue.increment(-diamonds),
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    transaction.set(userRef, {
      diamonds: firebaseAdmin.firestore.FieldValue.increment(-diamonds)
    }, { merge: true });
  });
  return { diamondsDeducted: diamonds };
}
