import { db, firebaseAdmin } from "../config/firebaseAdmin.js";

export const defaultPlans = {
  first_9: { title: "First-time Offer", amount: 9, diamonds: 30, minutes: 1 },
  offer_49: { title: "Friend Offer", amount: 49, diamonds: 160, minutes: 4 },
  premium_99: { title: "Premium Offer", amount: 99, diamonds: 360, minutes: 10 },
  normal_19: { title: "Starter", amount: 19, diamonds: 50, minutes: 1 },
  normal_99: { title: "Popular", amount: 99, diamonds: 300, minutes: 8 },
  normal_299: { title: "Premium", amount: 299, diamonds: 1000, minutes: 30 }
};

export async function creditWallet(userId, planId) {
  const plan = defaultPlans[planId] || defaultPlans.normal_19;
  const inc = firebaseAdmin.firestore.FieldValue.increment;
  await db.collection("diamondWallets").doc(userId).set({
    userId,
    diamonds: inc(plan.diamonds),
    minutes: inc(plan.minutes),
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await db.collection("users").doc(userId).set({ diamonds: inc(plan.diamonds) }, { merge: true });
  return plan;
}
