import { env } from "../config/env.js";
import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { razorpay } from "../config/razorpay.js";
import Razorpay from "razorpay";
import { getActivePaymentAccount, markAccountUsed } from "../services/bankSwitchService.js";
import { creditWallet, getPlan } from "../services/paymentService.js";
import { getLocalResource, listLocalResource, upsertLocalResource } from "../services/localDataStore.js";
import { verifyRazorpaySignature } from "../utils/crypto.js";

const PLAN_FALLBACK_LINKS = {
  first_9: "https://rzp.io/rzp/goFzJpG",
  normal_19: "https://rzp.io/rzp/z1PA4DZ8",
  offer_49: "https://rzp.io/rzp/nmmc8s4L",
  premium_99: "https://rzp.io/rzp/nHX3lxKQ"
};

function publicAccount(account) {
  if (!account) return null;
  const { keySecret, webhookSecret, ...safe } = account;
  return safe;
}

function fallbackPaymentUrlFor(planId, account) {
  return (
    account?.fallbackPaymentUrl ||
    account?.paymentLinkUrl ||
    PLAN_FALLBACK_LINKS[planId] ||
    env.razorpay.fallbackPaymentUrl ||
    ""
  );
}

function razorpayClientFor(account) {
  const keyId = account?.keyId || env.razorpay.keyId;
  const keySecret = account?.keySecret || env.razorpay.keySecret;
  if (!keyId || !keySecret || String(keyId).includes("xxxxx")) return null;
  if (!account?.keyId) return razorpay;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function nowValue() {
  return hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
}

async function savePayment(orderId, payload) {
  if (!hasFirestoreCredentials) {
    await upsertLocalResource("payments", { id: orderId, ...payload, updatedAt: new Date().toISOString() });
    return;
  }
  try {
    await db.collection("payments").doc(orderId).set(payload, { merge: true });
  } catch {}
}

async function verifyAnyWebhook(raw, signature) {
  if (env.razorpay.webhookSecret && verifyRazorpaySignature(raw, signature, env.razorpay.webhookSecret)) return true;
  if (!hasFirestoreCredentials) {
    const accounts = await listLocalResource("paymentAccounts");
    return accounts.some((account) => account.active !== false && account.webhookSecret && verifyRazorpaySignature(raw, signature, account.webhookSecret));
  }
  const snap = await db.collection("paymentAccounts").where("active", "==", true).limit(50).get().catch(() => null);
  if (!snap) return false;
  return snap.docs.some((doc) => {
    const secret = doc.data().webhookSecret;
    return secret && verifyRazorpaySignature(raw, signature, secret);
  });
}

async function findPayment(orderId) {
  if (!hasFirestoreCredentials) return getLocalResource("payments", orderId);
  const ref = db.collection("payments").doc(orderId);
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function markPaid(orderId, patch) {
  if (!hasFirestoreCredentials) {
    const item = await getLocalResource("payments", orderId);
    if (!item) return null;
    const next = { ...item, ...patch, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await upsertLocalResource("payments", next);
    return next;
  }
  await db.collection("payments").doc(orderId).set({
    ...patch,
    paidAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  return findPayment(orderId);
}

async function secretForPayment(item) {
  if (!item?.activePaymentAccountId) return env.razorpay.keySecret;
  if (!hasFirestoreCredentials) {
    const accounts = [
      ...(await listLocalResource("paymentAccounts")),
      ...(await listLocalResource("bankAccounts"))
    ];
    return accounts.find((account) => account.id === item.activePaymentAccountId)?.keySecret || env.razorpay.keySecret;
  }
  const snap = await db.collection("paymentAccounts").doc(item.activePaymentAccountId).get().catch(() => null);
  return snap?.data()?.keySecret || env.razorpay.keySecret;
}

export async function createOrder(req, res) {
  const planId = req.body.planId || "normal_19";
  const plan = await getPlan(planId);
  const amount = Number(plan.amount || plan.price);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Invalid recharge plan." });
  const account = await getActivePaymentAccount(amount);
  const fallbackPaymentUrl = fallbackPaymentUrlFor(planId, account);
  const gateway = account?.gateway || "razorpay";
  if (gateway === "upi" || gateway === "manual_upi" || (account?.upiId && !account?.keyId && !env.razorpay.keyId)) {
    const orderId = `manual_${Date.now()}`;
    await savePayment(orderId, {
      userId: req.user.uid,
      planId,
      amount,
      status: "manual_pending",
      orderId,
      activePaymentAccountId: account?.id || null,
      createdAt: nowValue()
    });
    return res.json({
      orderId,
      amount: amount * 100,
      account: publicAccount(account),
      manual: true,
      paymentOptions: ["UPI", "QR", "PhonePe", "Google Pay", "Paytm", "BHIM"],
      fallbackPaymentUrl
    });
  }
  const client = razorpayClientFor(account);
  if (!client) {
    const orderId = `order_demo_${Date.now()}`;
    await savePayment(orderId, {
      userId: req.user.uid,
      planId,
      amount,
      status: "demo_created",
      orderId,
      activePaymentAccountId: account?.id || null,
      createdAt: nowValue()
    });
    return res.json({
      orderId,
      amount: amount * 100,
      keyId: account?.keyId || env.razorpay.keyId || "rzp_test_missing",
      account: publicAccount(account),
      demo: true,
      fallbackPaymentUrl
    });
  }
  let order;
  try {
    order = await client.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `fh_${Date.now()}`,
      notes: { userId: req.user.uid, planId, accountId: account?.id || "" }
    });
  } catch {
    const orderId = `order_demo_${Date.now()}`;
    await savePayment(orderId, {
      userId: req.user.uid,
      planId,
      amount,
      status: "demo_created",
      orderId,
      activePaymentAccountId: account?.id || null,
      createdAt: nowValue()
    });
    return res.json({
      orderId,
      amount: amount * 100,
      keyId: account?.keyId || env.razorpay.keyId || "rzp_test_missing",
      account: publicAccount(account),
      demo: true,
      fallbackPaymentUrl
    });
  }
  await savePayment(order.id, {
    userId: req.user.uid,
    planId,
    amount,
    status: "created",
    orderId: order.id,
    activePaymentAccountId: account?.id || null,
    createdAt: nowValue()
  });
  res.json({
    orderId: order.id,
    amount: order.amount,
    keyId: account?.keyId || env.razorpay.keyId,
    account: publicAccount(account),
    paymentOptions: ["UPI", "Cards", "Netbanking", "Wallets", "Pay Later", "QR"],
    fallbackPaymentUrl
  });
}

export async function verifyPayment(req, res) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  const item = await findPayment(orderId);
  if (!item) return res.status(404).json({ message: "Payment order not found." });
  const secret = await secretForPayment(item);
  if (!verifyRazorpaySignature(`${orderId}|${paymentId}`, signature, secret)) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }
  if (item.status !== "paid") {
    await markPaid(orderId, { status: "paid", paymentId });
    await creditWallet(item.userId, item.planId);
    await markAccountUsed(item.activePaymentAccountId, Number(item.amount || 0));
  }
  const plan = await getPlan(item.planId);
  res.json({ ok: true, plan, orderId, paymentId });
}

export async function createSubscription(req, res) {
  const planId = req.body.planId || "premium_99";
  const plan = await getPlan(planId);
  const account = await getActivePaymentAccount(Number(plan.price || plan.amount || 0));
  const client = razorpayClientFor(account);
  const razorpayPlanId = plan.razorpayPlanId || plan.gatewayPlanId;
  if (!client) return res.status(400).json({ message: "Razorpay keys are not configured." });
  if (!razorpayPlanId) return res.status(400).json({ message: "Add Razorpay subscription plan id in admin first." });
  const subscription = await client.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: Number(plan.totalCycles || 12),
    quantity: 1,
    customer_notify: 1,
    notes: {
      userId: req.user.uid,
      planId,
      accountId: account?.id || ""
    }
  });
  await savePayment(subscription.id, {
    userId: req.user.uid,
    planId,
    amount: Number(plan.price || plan.amount || 0),
    status: "subscription_created",
    subscriptionId: subscription.id,
    activePaymentAccountId: account?.id || null,
    createdAt: hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
  });
  res.json({ subscriptionId: subscription.id, status: subscription.status, keyId: account?.keyId || env.razorpay.keyId, account: publicAccount(account) });
}

export async function webhook(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const raw = req.rawBody || JSON.stringify(req.body);
  if (!(await verifyAnyWebhook(raw, signature))) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }
  const event = req.body;
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const item = await findPayment(orderId);
    if (item && item.status !== "paid") {
      await markPaid(orderId, { status: "paid", paymentId: payment.id });
      await creditWallet(item.userId, item.planId);
      await markAccountUsed(item.activePaymentAccountId, Number(item.amount || 0));
    }
  }
  res.json({ received: true });
}
