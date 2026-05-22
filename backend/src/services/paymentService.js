import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { getLocalResource, upsertLocalResource } from "./localDataStore.js";

export const defaultPlans = {
  first_9: { id: "first_9", title: "First-time Offer", amount: 9, price: 9, originalPrice: 19, diamonds: 30, minutes: 1, active: true, autoPay: true, autoPayAmount: 9 },
  offer_49: { id: "offer_49", title: "Friend Offer", amount: 49, price: 49, originalPrice: 99, diamonds: 160, minutes: 4, active: true, autoPay: true, autoPayAmount: 49 },
  premium_99: { id: "premium_99", title: "Premium Offer", amount: 99, price: 99, originalPrice: 199, diamonds: 360, minutes: 10, active: true, subscription: true, autoPay: true, autoPayAmount: 99 },
  normal_19: { id: "normal_19", title: "Starter", amount: 19, price: 19, originalPrice: 19, diamonds: 50, minutes: 1, active: true, autoPay: true, autoPayAmount: 19 },
  normal_99: { id: "normal_99", title: "Popular", amount: 99, price: 99, originalPrice: 99, diamonds: 300, minutes: 8, active: true },
  normal_299: { id: "normal_299", title: "Premium", amount: 299, price: 299, originalPrice: 299, diamonds: 1000, minutes: 30, active: true }
};

export async function getPlan(planId = "normal_19") {
  const fallback = defaultPlans[planId] || defaultPlans.normal_19;
  if (!hasFirestoreCredentials) {
    const item = await getLocalResource("plans", planId);
    if (!item || item.active === false) return fallback;
    const price = Number(item.price ?? item.amount ?? fallback.amount);
    return {
      ...fallback,
      ...item,
      amount: price,
      price,
      diamonds: Number(item.diamonds ?? fallback.diamonds),
      minutes: Number(item.minutes ?? fallback.minutes)
    };
  }
  try {
    const snap = await db.collection("plans").doc(planId).get();
    if (!snap.exists) return fallback;
    const data = { id: snap.id, ...snap.data() };
    if (data.active === false) return fallback;
    const price = Number(data.price ?? data.amount ?? fallback.amount);
    return {
      ...fallback,
      ...data,
      amount: price,
      price,
      diamonds: Number(data.diamonds ?? fallback.diamonds),
      minutes: Number(data.minutes ?? fallback.minutes)
    };
  } catch {
    return fallback;
  }
}

export async function creditWallet(userId, planId) {
  const plan = await getPlan(planId);
  if (!hasFirestoreCredentials) {
    const currentWallet = await getLocalResource("diamondWallets", userId);
    await upsertLocalResource("diamondWallets", {
      ...(currentWallet || {}),
      id: userId,
      userId,
      diamonds: Number(currentWallet?.diamonds || 0) + Number(plan.diamonds || 0),
      minutes: Number(currentWallet?.minutes || 0) + Number(plan.minutes || 0),
      updatedAt: new Date().toISOString()
    });
    const currentUser = await getLocalResource("users", userId);
    if (currentUser) {
      await upsertLocalResource("users", {
        ...currentUser,
        diamonds: Number(currentUser.diamonds || 0) + Number(plan.diamonds || 0),
        updatedAt: new Date().toISOString()
      });
    }
    return plan;
  }
  const inc = firebaseAdmin.firestore.FieldValue.increment;
  try {
    await db.collection("diamondWallets").doc(userId).set({
      userId,
      diamonds: inc(plan.diamonds),
      minutes: inc(plan.minutes),
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await db.collection("users").doc(userId).set({ diamonds: inc(plan.diamonds) }, { merge: true });
  } catch {}
  return plan;
}
