import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Headset, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { defaultPlans, listenPlans } from "../services/appConfig";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const PLAN_FEATURES = {
  first_9: ["Chatting", "Basic Profile Access", "Message Requests", "Limited Support"],
  normal_19: ["Chatting", "500 Diamonds", "Profile Boost", "Basic Support"],
  offer_49: ["3000 Diamonds", "Most Popular", "Profile Highlights", "Priority Chat"],
  premium_99: ["Premium Access", "Extra Diamonds", "Top Visibility", "Priority Support"]
};

const PLAN_DISPLAY = {
  first_9: { title: "Starter Lite", originalPrice: 19, price: 9, savePercent: 53, badge: "" },
  normal_19: { title: "Starter", originalPrice: 49, price: 19, savePercent: 61, badge: "" },
  offer_49: { title: "Best Value", originalPrice: 199, price: 49, savePercent: 75, badge: "Most Popular" },
  premium_99: { title: "Premium", originalPrice: 399, price: 99, savePercent: 75, badge: "" }
};

let cashfreeLoader;

function prepareCashfreeConnection() {
  if (document.querySelector('link[data-cashfree-preconnect="true"]')) return;
  for (const rel of ["dns-prefetch", "preconnect"]) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = "https://sdk.cashfree.com";
    link.dataset.cashfreePreconnect = "true";
    if (rel === "preconnect") link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
}

function loadCashfreeSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (!cashfreeLoader) {
    prepareCashfreeConnection();
    cashfreeLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => resolve(window.Cashfree);
      script.onerror = () => reject(new Error("Unable to load Cashfree checkout."));
      document.head.appendChild(script);
    });
  }
  return cashfreeLoader;
}

function getDisplayPlan(plan) {
  const preset = PLAN_DISPLAY[plan.id] || {};
  const price = Number(preset.price ?? plan.price ?? plan.amount ?? 0);
  const originalPrice = Number(preset.originalPrice ?? plan.originalPrice ?? price);
  const discountAmount = Math.max(0, originalPrice - price);
  const savePercent = Number(preset.savePercent ?? (originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0));
  return { ...plan, title: preset.title || plan.title || "Plan", price, originalPrice, discountAmount, savePercent, badge: preset.badge || "" };
}

export default function Recharge() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { applyWalletCredit } = useAuth();

  const [plans, setPlans] = useState(defaultPlans);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlans[0]?.id || "");

  useEffect(() => listenPlans(setPlans), []);
  useEffect(() => {
    prepareCashfreeConnection();
    loadCashfreeSdk().catch(() => {});
    const baseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
    if (baseUrl) {
      fetch(`${baseUrl}/payments/webhook`, { cache: "no-store", keepalive: true }).catch(() => {});
    }
  }, []);
  useEffect(() => {
    if (!selectedPlanId && plans.length) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const displayPlans = useMemo(() => plans.slice(0, 4).map(getDisplayPlan), [plans]);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) return;
    let active = true;
    setBusy("verify-return");
    api.post("/payments/verify", { order_id: orderId })
      .then(({ data }) => {
        if (!active) return;
        applyWalletCredit(data.plan);
        setPaymentStatus({ type: "success", title: "Payment successful", body: `${data.plan?.diamonds || 0} diamonds added to your wallet.`, orderId });
      })
      .catch((err) => {
        if (!active) return;
        setPaymentStatus({ type: "error", title: "Payment failed", body: err.response?.data?.message || "We could not verify this payment.", orderId });
      })
      .finally(() => {
        if (active) setBusy("");
      });
    return () => {
      active = false;
    };
  }, [applyWalletCredit, searchParams]);

  async function verifyOrder(orderId, plan) {
    const { data } = await api.post("/payments/verify", { order_id: orderId }, { timeout: 20000 });
    applyWalletCredit(data.plan);
    setPaymentStatus({ type: "success", title: "Payment successful", body: `${data.plan?.diamonds || plan.diamonds || 0} diamonds added to your wallet.`, orderId });
  }

  async function pay(plan) {
    setError("");
    setNotice("");
    setPaymentStatus(null);
    setBusy(plan.id);
    try {
      const orderRequest = api.post("/payments/create-order", { planId: plan.id }, { timeout: 20000 });
      const sdkRequest = loadCashfreeSdk();
      const [{ data }, Cashfree] = await Promise.all([orderRequest, sdkRequest]);
      const cashfree = Cashfree({ mode: data.cashfreeEnv === "sandbox" ? "sandbox" : "production" });
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: data.payment_session_id || data.paymentSessionId,
        redirectTarget: "_modal"
      });
      if (checkoutResult?.error) throw new Error(checkoutResult.error.message || "Payment failed.");
      await verifyOrder(data.order_id || data.orderId, plan);
    } catch (err) {
      setPaymentStatus({ type: "error", title: "Payment failed", body: err.response?.data?.message || err.message || "Please try again." });
      setError(err.response?.data?.message || err.message || "Payment failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="phone-page px-2 pb-20 pt-2 md:pb-28">
      <div className="rounded-[24px] border border-zinc-200 bg-[#faf9fc] p-2.5">
        <header className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-white px-2.5 py-2 shadow-sm">
          <button onClick={() => navigate(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-100" aria-label="Back">
            <ArrowLeft size={21} />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="text-2xl font-black leading-none text-[#121a36]">Friend <span className="text-[#f72565]">Hub</span></h1>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500"><ShieldCheck size={14} /> Secure Cashfree Checkout</p>
          </div>
          <button onClick={() => setNotice("Support: friendhub119@gmail.com. Share your Cashfree order ID for payment help.")} className="grid h-11 shrink-0 place-items-center rounded-xl bg-[#fff1f7] px-2 text-xs font-black text-[#f72565]">
            <span className="inline-flex items-center gap-1"><Headset size={14} /> Help</span>
          </button>
        </header>

        {location.state?.reason && <p className="mb-2 rounded-xl bg-[#fff4f8] p-2 text-xs font-semibold text-[#e93078] md:text-sm">{location.state.reason}</p>}
        <p className="mb-2 rounded-xl bg-[#fff4f8] p-2 text-xs font-semibold text-[#e93078] md:text-sm">
          Recharge credits for premium social features. Payments are processed only through Cashfree.
        </p>
        {error && <p className="mb-2 rounded-xl bg-red-50 p-2 text-xs font-semibold text-red-600 md:text-sm">{error}</p>}
        {notice && <p className="mb-2 rounded-xl bg-emerald-50 p-2 text-xs font-semibold text-emerald-700 md:text-sm">{notice}</p>}

        <article className="rounded-[20px] border border-zinc-200 bg-white p-2 md:p-3">
          <div className="mb-2 rounded-xl bg-[#fff7fb] px-2.5 py-2">
            <h2 className="text-xl font-black leading-tight text-[#111626]">Choose Plan</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="rounded-full bg-rose-100 px-2 py-1 font-black text-[#f72565]">Limited Time Offer</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-600">Save up to 75%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {displayPlans.map((plan) => {
              const active = plan.id === selectedPlanId;
              return (
                <button
                  key={plan.id}
                  disabled={Boolean(busy)}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    pay(plan);
                  }}
                  className={`relative min-w-0 rounded-2xl border p-2 text-left disabled:opacity-70 ${active ? "border-[#f72565] bg-[#fff6fa]" : "border-zinc-200 bg-white"}`}
                >
                  {plan.badge && <span className="mb-1 inline-flex rounded-full bg-[#f72565] px-2 py-0.5 text-[9px] font-black text-white">Most Popular</span>}
                  <p className="truncate text-[11px] font-black text-zinc-500">{plan.title}</p>
                  <div className="mt-1 flex items-end gap-1">
                    <p className="text-[11px] font-black text-zinc-400 line-through">₹{plan.originalPrice}</p>
                    <p className="text-2xl font-black leading-none text-[#f72565]">₹{plan.price}</p>
                  </div>
                  <p className="mt-1 inline-flex rounded-full bg-[#ffe5f1] px-1.5 py-0.5 text-[9px] font-black text-[#f72565]">DISCOUNT ₹{plan.discountAmount}</p>
                  <p className="mt-1 text-[11px] font-black text-emerald-600">You save {plan.savePercent}%</p>
                  <ul className="mt-1.5 space-y-0.5 text-[10px] font-semibold leading-4 text-zinc-700">
                    {(PLAN_FEATURES[plan.id] || []).slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5"><CheckCircle2 size={11} className="shrink-0 text-[#f72565]" /><span className="min-w-0 truncate">{feature}</span></li>
                    ))}
                  </ul>
                  <span className="pink-gradient mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-xs font-black text-white">
                    <Sparkles size={14} />
                    {busy === plan.id ? "Opening..." : `Pay Securely ₹${plan.price}`}
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        {paymentStatus && (
          <article className="mt-2 rounded-[22px] border border-zinc-200 bg-white p-3">
            <div className={`rounded-xl p-3 ${paymentStatus.type === "success" ? "bg-emerald-50" : "bg-red-50"}`}>
              <div className="flex items-start gap-2">
                {paymentStatus.type === "success" ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 shrink-0 text-red-600" />}
                <div>
                  <h3 className="text-lg font-black text-zinc-900">{paymentStatus.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-zinc-600">{paymentStatus.body}</p>
                  {paymentStatus.orderId && <p className="mt-2 text-xs font-black text-zinc-500">Order ID: {paymentStatus.orderId}</p>}
                </div>
              </div>
            </div>
          </article>
        )}

        <div className="mt-2 text-center text-xs font-semibold text-zinc-500 md:text-sm">
          Payments are collected only for digital credits and premium social networking features.
        </div>
        <footer className="mt-2 text-center text-[11px] font-semibold text-zinc-500">
          <p>Friend Hub is a social networking and friendship platform. It is not an adult, escort, or matrimonial service.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            <Link to="/about" className="text-[#f72565]">About Us</Link>
            <Link to="/contact" className="text-[#f72565]">Contact Us</Link>
            <Link to="/privacy" className="text-[#f72565]">Privacy Policy</Link>
            <Link to="/terms" className="text-[#f72565]">Terms</Link>
            <Link to="/refund" className="text-[#f72565]">Refund Policy</Link>
            <Link to="/safety" className="text-[#f72565]">User Safety</Link>
            <Link to="/abuse" className="text-[#f72565]">Report Abuse</Link>
          </div>
        </footer>
        <div className="mt-1 text-center text-xs font-semibold text-zinc-500 md:text-sm">
          100% Secure Payments Powered by <span className="font-black text-[#1142a7]">Cashfree</span>
        </div>
      </div>
    </section>
  );
}
