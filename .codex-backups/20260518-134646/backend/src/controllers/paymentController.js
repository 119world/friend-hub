import { env } from "../config/env.js";
import { db, firebaseAdmin } from "../config/firebaseAdmin.js";
import { razorpay } from "../config/razorpay.js";
import { getActivePaymentAccount, markAccountUsed } from "../services/bankSwitchService.js";
import { creditWallet, defaultPlans } from "../services/paymentService.js";
import { verifyRazorpaySignature } from "../utils/crypto.js";

export async function createOrder(req, res) {
  const plan = defaultPlans[req.body.planId] || defaultPlans.normal_19;
  const amount = Number(req.body.amount || plan.amount);
  const account = await getActivePaymentAccount(amount);
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `fh_${Date.now()}`,
    notes: { userId: req.user.uid, planId: req.body.planId || "normal_19", accountId: account?.id || "" }
  });
  await db.collection("payments").doc(order.id).set({
    userId: req.user.uid,
    planId: req.body.planId || "normal_19",
    amount,
    status: "created",
    orderId: order.id,
    activePaymentAccountId: account?.id || null,
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ orderId: order.id, amount: order.amount, keyId: env.razorpay.keyId, account });
}

export async function webhook(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const raw = req.rawBody || JSON.stringify(req.body);
  if (!verifyRazorpaySignature(raw, signature, env.razorpay.webhookSecret || "")) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }
  const event = req.body;
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const ref = db.collection("payments").doc(orderId);
    const snap = await ref.get();
    const item = snap.data();
    if (item?.status !== "paid") {
      await ref.set({
        status: "paid",
        paymentId: payment.id,
        paidAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await creditWallet(item.userId, item.planId);
      await markAccountUsed(item.activePaymentAccountId, Number(item.amount || 0));
    }
  }
  res.json({ received: true });
}
