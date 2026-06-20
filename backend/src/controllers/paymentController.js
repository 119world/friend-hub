import { cashfree, hasCashfreeCredentials } from "../config/cashfree.js";
import { env } from "../config/env.js";
import { db, firebaseAdmin, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { creditWallet, getPlan } from "../services/paymentService.js";
import { getLocalResource, listLocalResource, upsertLocalResource } from "../services/localDataStore.js";

const STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
};

function nowValue() {
  return hasFirestoreCredentials ? firebaseAdmin.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
}

function orderIdFor(userId, planId) {
  const safeUser = String(userId || "user").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 28);
  const safePlan = String(planId || "plan").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  return `fh_${safeUser}_${safePlan}_${Date.now()}`;
}

function cleanPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : "9999999999";
}

function customerDetails(req) {
  return {
    customer_id: String(req.user.uid),
    customer_name: String(req.user.name || req.user.displayName || "Friend Hub User").slice(0, 80),
    customer_email: req.user.email || undefined,
    customer_phone: cleanPhone(req.body?.customerPhone || req.user.phone_number || req.user.phone)
  };
}

function paymentDoc(orderId, payload) {
  return {
    id: orderId,
    order_id: orderId,
    orderId,
    currency: "INR",
    ...payload
  };
}

async function savePayment(orderId, payload) {
  const doc = paymentDoc(orderId, {
    ...payload,
    updated_at: nowValue(),
    updatedAt: nowValue()
  });
  if (!hasFirestoreCredentials) {
    await upsertLocalResource("payments", { ...doc, updated_at: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return doc;
  }
  await db.collection("payments").doc(orderId).set(doc, { merge: true });
  return doc;
}

async function findPayment(orderId) {
  if (!orderId) return null;
  if (!hasFirestoreCredentials) return getLocalResource("payments", orderId);
  const snap = await db.collection("payments").doc(orderId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function findReusablePendingPayment(userId, planId, amount) {
  const matches = [];
  if (hasFirestoreCredentials) {
    const snap = await db.collection("payments")
      .where("user_id", "==", userId)
      .where("planId", "==", planId)
      .where("status", "==", STATUS.PENDING)
      .limit(10)
      .get()
      .catch(() => null);
    if (snap) matches.push(...snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } else {
    matches.push(...(await listLocalResource("payments")).filter((item) => (
      item.user_id === userId &&
      item.planId === planId &&
      item.status === STATUS.PENDING
    )));
  }
  return matches
    .filter((item) => Number(item.amount) === Number(amount) && item.payment_session_id)
    .sort((a, b) => String(b.created_at || b.createdAt || "").localeCompare(String(a.created_at || a.createdAt || "")))[0] || null;
}

function frontendReturnUrl() {
  return `${env.clientUrl.replace(/\/$/, "")}/recharge?order_id={order_id}`;
}

function backendWebhookUrl() {
  const base = (env.serverUrl || "").replace(/\/$/, "");
  return base ? `${base}/api/payments/webhook` : undefined;
}

function cashfreeError(error) {
  const message = error?.response?.data?.message || error?.response?.data?.error_description || error?.message || "Cashfree request failed.";
  if (/auth/i.test(message)) {
    return "Cashfree authentication failed. Check CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET, and CASHFREE_ENV on the backend.";
  }
  return message;
}

function paymentIdFromPayments(payments = []) {
  return payments.find((item) => item.payment_status === "SUCCESS")?.cf_payment_id ||
    payments[0]?.cf_payment_id ||
    "";
}

function isSuccess(order, payments = []) {
  return order?.order_status === "PAID" || payments.some((item) => item.payment_status === "SUCCESS");
}

function isFailed(order, payments = []) {
  return ["EXPIRED", "TERMINATED"].includes(order?.order_status) ||
    payments.some((item) => ["FAILED", "CANCELLED", "USER_DROPPED"].includes(item.payment_status));
}

async function finalizePayment(orderId, status, paymentId = "") {
  const item = await findPayment(orderId);
  if (!item) return null;
  if (item.status === STATUS.SUCCESS) return item;

  const patch = {
    status,
    payment_id: paymentId || item.payment_id || "",
    paymentId: paymentId || item.paymentId || "",
    updated_at: nowValue(),
    updatedAt: nowValue()
  };
  if (status === STATUS.SUCCESS) {
    patch.paid_at = nowValue();
    patch.paidAt = nowValue();
  }
  const saved = await savePayment(orderId, patch);
  console.info("[payments] payment event", { orderId, status, paymentId: patch.payment_id });

  if (status === STATUS.SUCCESS) {
    await creditWallet(item.user_id || item.userId, item.planId);
  }
  return { ...item, ...saved };
}

export async function createOrder(req, res) {
  if (!hasCashfreeCredentials()) {
    return res.status(503).json({ message: "Cashfree credentials are not configured." });
  }

  const planId = String(req.body?.planId || "normal_19").trim();
  const plan = await getPlan(planId);
  const amount = Number(plan.amount || plan.price);
  if (!Number.isFinite(amount) || amount < 1) {
    return res.status(400).json({ message: "Invalid recharge plan." });
  }

  const existing = await findReusablePendingPayment(req.user.uid, planId, amount);
  if (existing) {
    return res.json({
      order_id: existing.order_id,
      orderId: existing.orderId,
      payment_session_id: existing.payment_session_id,
      paymentSessionId: existing.paymentSessionId,
      amount,
      currency: "INR",
      cashfreeEnv: env.cashfree.env === "SANDBOX" ? "sandbox" : "production"
    });
  }

  const orderId = orderIdFor(req.user.uid, planId);
  const notifyUrl = backendWebhookUrl();
  const request = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: customerDetails(req),
    order_meta: {
      return_url: frontendReturnUrl(),
      ...(notifyUrl ? { notify_url: notifyUrl } : {})
    },
    order_note: `Friend Hub recharge: ${plan.title || planId}`,
    order_tags: {
      user_id: req.user.uid,
      plan_id: planId
    }
  };

  let response;
  try {
    response = await cashfree.PGCreateOrder(request, undefined, orderId);
  } catch (error) {
    console.error("[payments] Cashfree order creation failed", { orderId, error: cashfreeError(error) });
    return res.status(502).json({ message: cashfreeError(error) });
  }

  const data = response.data || {};
  await savePayment(orderId, {
    user_id: req.user.uid,
    userId: req.user.uid,
    planId,
    amount,
    currency: "INR",
    status: STATUS.PENDING,
    payment_id: "",
    paymentId: "",
    cf_order_id: data.cf_order_id || "",
    payment_session_id: data.payment_session_id,
    paymentSessionId: data.payment_session_id,
    created_at: nowValue(),
    createdAt: nowValue()
  });
  console.info("[payments] Cashfree order created", { orderId, userId: req.user.uid, amount });

  return res.status(201).json({
    order_id: orderId,
    orderId,
    payment_session_id: data.payment_session_id,
    paymentSessionId: data.payment_session_id,
    amount,
    currency: "INR",
    cashfreeEnv: env.cashfree.env === "SANDBOX" ? "sandbox" : "production"
  });
}

export async function verifyPayment(req, res) {
  const orderId = String(req.body?.order_id || req.body?.orderId || req.query?.order_id || "").trim();
  if (!orderId) return res.status(400).json({ message: "Order ID is required." });

  const item = await findPayment(orderId);
  if (!item || (item.user_id || item.userId) !== req.user.uid) {
    return res.status(404).json({ message: "Payment order not found." });
  }

  let order;
  let payments = [];
  try {
    const [orderResponse, paymentsResponse] = await Promise.all([
      cashfree.PGFetchOrder(orderId),
      cashfree.PGOrderFetchPayments(orderId).catch(() => ({ data: [] }))
    ]);
    order = orderResponse.data;
    payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
  } catch (error) {
    console.error("[payments] Cashfree verification failed", { orderId, error: cashfreeError(error) });
    return res.status(502).json({ message: cashfreeError(error) });
  }

  const paymentId = paymentIdFromPayments(payments);
  if (isSuccess(order, payments)) {
    const saved = await finalizePayment(orderId, STATUS.SUCCESS, paymentId);
    const plan = await getPlan(saved.planId || item.planId);
    return res.json({ ok: true, status: STATUS.SUCCESS, plan, order_id: orderId, orderId, payment_id: paymentId, paymentId });
  }

  if (isFailed(order, payments)) {
    await finalizePayment(orderId, STATUS.FAILED, paymentId);
    return res.status(402).json({ ok: false, status: STATUS.FAILED, order_id: orderId, orderId, payment_id: paymentId, paymentId, message: "Payment failed." });
  }

  return res.status(202).json({ ok: false, status: STATUS.PENDING, order_id: orderId, orderId, message: "Payment is still pending." });
}

function isCashfreeTestRequest(event, signature, timestamp) {
  const hasPaymentData = event?.data?.payment || event?.data?.order || event?.order_id || event?.payment_status;
  return !signature || !timestamp || !hasPaymentData;
}

function webhookEventDetails(event = {}) {
  const type = String(event.type || event.event || "").toUpperCase();
  const orderId = event?.data?.order?.order_id || event?.data?.order_id || event?.order_id;
  const paymentId = event?.data?.payment?.cf_payment_id || event?.data?.payment?.payment_id || event?.cf_payment_id || "";
  const paymentStatus = String(event?.data?.payment?.payment_status || event?.payment_status || "").toUpperCase();
  const orderStatus = String(event?.data?.order?.order_status || event?.order_status || "").toUpperCase();
  return { type, orderId, paymentId, paymentStatus, orderStatus };
}

async function processCashfreeWebhook(event) {
  const { type, orderId, paymentId, paymentStatus, orderStatus } = webhookEventDetails(event);
  console.info("[payments] Cashfree webhook received", { type, orderId, paymentStatus, orderStatus });

  if (!orderId) return;

  if (
    paymentStatus === "SUCCESS" ||
    orderStatus === "PAID" ||
    type.includes("SUCCESS")
  ) {
    await finalizePayment(orderId, STATUS.SUCCESS, paymentId);
    return;
  }

  if (
    ["FAILED", "CANCELLED", "USER_DROPPED"].includes(paymentStatus) ||
    ["EXPIRED", "TERMINATED"].includes(orderStatus) ||
    type.includes("FAILED") ||
    type.includes("DROPPED")
  ) {
    await finalizePayment(orderId, STATUS.FAILED, paymentId);
  }
}

export function webhookHealth(req, res) {
  res.json({ status: "ok" });
}

export async function webhook(req, res) {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  const raw = req.rawBody || JSON.stringify(req.body || {});
  const event = req.body || {};

  console.info("[payments] Cashfree webhook payload", event);

  if (isCashfreeTestRequest(event, signature, timestamp)) {
    return res.status(200).json({ received: true, test: true });
  }

  try {
    cashfree.PGVerifyWebhookSignature(signature, raw, timestamp);
  } catch (error) {
    console.warn("[payments] Invalid Cashfree webhook signature", { error: error.message });
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  res.status(200).json({ received: true });
  processCashfreeWebhook(event).catch((error) => {
    console.error("[payments] Cashfree webhook processing failed", { error: error.message });
  });
}
