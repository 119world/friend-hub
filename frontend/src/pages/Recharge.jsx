import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Headset,
  Landmark,
  Lock,
  QrCode,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { defaultPlans, listenPlans } from "../services/appConfig";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const PLAN_FEATURES = {
  first_9: ["Chatting", "Basic Profile Access", "Message Requests", "Limited Support"],
  normal_19: ["Chatting", "500 Diamonds", "Profile Boost", "Basic Support"],
  offer_49: ["3000 Diamonds", "Most Popular", "More Matches", "Priority Chat"],
  premium_99: ["Premium Access", "Extra Diamonds", "Top Visibility", "Priority Support"]
};

const PLAN_DISPLAY = {
  first_9: { title: "Starter Lite", originalPrice: 19, price: 9, savePercent: 53, badge: "" },
  normal_19: { title: "Starter", originalPrice: 49, price: 19, savePercent: 61, badge: "" },
  offer_49: { title: "Best Value", originalPrice: 199, price: 49, savePercent: 75, badge: "Most Popular" },
  premium_99: { title: "Premium", originalPrice: 399, price: 99, savePercent: 75, badge: "" }
};

const PAYMENT_METHODS = [
  { key: "UPI", label: "UPI", sub: "Pay using any UPI app", icon: QrCode, apiValue: "UPI" },
  { key: "Razorpay", label: "Razorpay", sub: "Fast and secure checkout", icon: ShieldCheck, apiValue: "Razorpay" },
  { key: "Cards", label: "Cards", sub: "Visa, Mastercard, RuPay", icon: CreditCard, apiValue: "Cards" },
  { key: "Net Banking", label: "Net Banking", sub: "All major banks", icon: Landmark, apiValue: "Netbanking" },
  { key: "Wallets", label: "Wallet", sub: "Paytm, PhonePe, Amazon Pay", icon: Wallet, apiValue: "Wallets" }
];

function getDisplayPlan(plan) {
  const preset = PLAN_DISPLAY[plan.id] || {};
  const price = Number(preset.price ?? plan.price ?? plan.amount ?? 0);
  const originalPrice = Number(preset.originalPrice ?? plan.originalPrice ?? price);
  const discountAmount = Math.max(0, originalPrice - price);
  const savePercent = Number(
    preset.savePercent ??
      (originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0)
  );
  return {
    ...plan,
    title: preset.title || plan.title || "Plan",
    price,
    originalPrice,
    discountAmount,
    savePercent,
    badge: preset.badge || ""
  };
}

export default function Recharge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyWalletCredit } = useAuth();

  const [plans, setPlans] = useState(defaultPlans);
  const [step, setStep] = useState("plan");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [manualPayment, setManualPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlans[0]?.id || "");
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0].key);

  useEffect(() => listenPlans(setPlans), []);
  useEffect(() => {
    if (!selectedPlanId && plans.length) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const displayPlans = useMemo(() => plans.slice(0, 4).map(getDisplayPlan), [plans]);
  const selectedPlan = useMemo(
    () => displayPlans.find((item) => item.id === selectedPlanId) || displayPlans[0],
    [displayPlans, selectedPlanId]
  );

  const selectedPrice = Number(selectedPlan?.price || selectedPlan?.amount || 0);
  const selectedOriginal = Number(selectedPlan?.originalPrice || selectedPrice || 0);
  const discountValue = Math.max(0, selectedOriginal - selectedPrice);
  const discountPercent = selectedPlan?.savePercent ?? (selectedOriginal > 0 ? Math.round((discountValue / selectedOriginal) * 100) : 0);
  const selectedMethod = PAYMENT_METHODS.find((item) => item.key === payMethod) || PAYMENT_METHODS[0];

  async function pay(plan) {
    setError("");
    setBusy(plan.id);
    setManualPayment(null);
    setPaymentStatus(null);
    try {
      const { data } = await api.post("/payments/create-order", {
        planId: plan.id,
        payMethod: selectedMethod.apiValue
      });
      if (data.manual) {
        setManualPayment({ plan, ...data });
        setPaymentStatus({
          type: "pending",
          title: "Manual payment opened",
          body: "A secure payment link was opened in a new tab."
        });
        if (data.fallbackPaymentUrl) window.open(data.fallbackPaymentUrl, "_blank", "noopener,noreferrer");
        setStep("status");
        return;
      }
      if (data.demo || !window.Razorpay) {
        setManualPayment({ plan, ...data, demo: true });
        setPaymentStatus({
          type: "pending",
          title: "Payment setup pending",
          body: "Razorpay checkout unavailable. Use the backup payment link."
        });
        if (data.fallbackPaymentUrl) window.open(data.fallbackPaymentUrl, "_blank", "noopener,noreferrer");
        setStep("status");
        return;
      }
      const rz = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Friend Hub",
        description: plan.title,
        order_id: data.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true
        },
        handler: async (response) => {
          try {
            const { data: verified } = await api.post("/payments/verify", response);
            applyWalletCredit(verified.plan);
            setPaymentStatus({
              type: "success",
              title: "Payment successful",
              body: `${verified.plan?.diamonds || plan.diamonds || 0} diamonds added to your wallet.`
            });
          } catch (verifyErr) {
            setPaymentStatus({
              type: "error",
              title: "Payment verification failed",
              body: verifyErr.response?.data?.message || "Please contact support with your order ID."
            });
          }
          setStep("status");
        }
      });
      rz.on("payment.failed", (event) => {
        setPaymentStatus({
          type: "error",
          title: "Payment failed",
          body: event?.error?.description || "Try another payment method."
        });
        setStep("status");
      });
      rz.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setBusy("");
    }
  }

  function openPaymentStep(planId) {
    setSelectedPlanId(planId);
    setError("");
    setStep("payment");
  }

  return (
    <section className="phone-page px-3 pb-24 pt-3 md:pb-28">
      <div className="rounded-[28px] border border-zinc-200 bg-[#faf9fc] p-3">
        <header className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2">
          <button onClick={() => (step === "plan" ? navigate(-1) : setStep("plan"))} className="rounded-xl bg-zinc-100 p-2" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-black leading-none text-[#121a36]">Friend <span className="text-[#f72565]">Hub</span></h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-zinc-500">
              <ShieldCheck size={14} /> Secure & Encrypted Payment
            </p>
          </div>
          <button className="rounded-xl bg-[#fff1f7] px-3 py-2 text-sm font-black text-[#f72565]">
            <span className="inline-flex items-center gap-1"><Headset size={15} /> Help</span>
          </button>
        </header>

        {location.state?.reason && (
          <p className="mb-2 rounded-xl bg-[#fff4f8] p-2 text-xs font-semibold text-[#e93078] md:text-sm">
            {location.state.reason}
          </p>
        )}

        {error && (
          <p className="mb-2 rounded-xl bg-red-50 p-2 text-xs font-semibold text-red-600 md:text-sm">
            {error}
          </p>
        )}

        {step === "plan" && (
          <article className="rounded-[22px] border border-zinc-200 bg-white p-2.5 md:p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fff7fb] px-2.5 py-2">
              <h2 className="text-2xl font-black leading-tight text-[#111626] md:text-3xl">Choose Your Plan</h2>
              <div className="flex shrink-0 items-center gap-1.5 text-[11px] md:text-sm">
                <span className="rounded-full bg-rose-100 px-2 py-1 font-black text-[#f72565]">Limited Time Offer</span>
                <span className="font-black text-emerald-600">Save up to 75%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
              {displayPlans.map((plan) => {
                const active = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-2.5 ${
                      active ? "border-[#f72565] bg-[#fff6fa]" : "border-zinc-200 bg-white"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2 left-3 rounded-full bg-[#f72565] px-2 py-0.5 text-[10px] font-black text-white">
                        {plan.badge}
                      </span>
                    )}
                    <p className="text-xs font-black text-zinc-500">{plan.title}</p>
                    <p className="text-sm font-black text-zinc-400 line-through">₹{plan.originalPrice}</p>
                    <p className="text-4xl font-black leading-none text-[#f72565]">₹{plan.price}</p>
                    <p className="mt-1 inline-flex rounded-full bg-[#ffe5f1] px-2 py-0.5 text-[11px] font-black text-[#f72565]">
                      DISCOUNT ₹{plan.discountAmount}
                    </p>
                    <p className="mt-1 text-sm font-black text-emerald-600">You save {plan.savePercent}%</p>
                    <ul className="mt-1.5 space-y-1 text-[12px] font-semibold text-zinc-700">
                      {(PLAN_FEATURES[plan.id] || []).slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="shrink-0 text-[#f72565]" />
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openPaymentStep(plan.id)}
                      className="pink-gradient mt-2 h-11 w-full rounded-full text-base font-black text-white"
                    >
                      Choose Plan
                    </button>
                  </div>
                );
              })}
            </div>
          </article>
        )}

        {step === "payment" && selectedPlan && (
          <article className="rounded-[22px] border border-zinc-200 bg-white p-2.5 md:p-3">
            <div className="rounded-xl bg-[#fff7fb] p-2.5">
              <h3 className="text-lg font-black text-[#111626]">Selected Plan: {selectedPlan.title}</h3>
              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-lg bg-white p-2 font-semibold text-zinc-600">Original: <span className="font-black line-through">₹{selectedOriginal}</span></p>
                <p className="rounded-lg bg-white p-2 font-semibold text-zinc-600">Discount: <span className="font-black text-emerald-600">₹{discountValue}</span></p>
              </div>
              <p className="mt-1 text-sm font-black text-[#f72565]">
                Final Amount: ₹{selectedPrice} ({discountPercent}% OFF)
              </p>
            </div>

            <h4 className="mt-3 text-lg font-black text-[#111626]">Select Payment Method</h4>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const active = payMethod === method.key;
                return (
                  <button
                    key={method.key}
                    onClick={() => setPayMethod(method.key)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                      active ? "border-[#f72565] bg-[#fff5fa]" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-50">
                        <Icon size={17} className="text-zinc-800" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-zinc-900">{method.label}</span>
                        <span className="block text-[11px] font-semibold text-zinc-500">{method.sub}</span>
                      </span>
                    </span>
                    <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-[#f72565] bg-[#f72565]" : "border-zinc-300"}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep("plan")}
                className="h-11 rounded-full border border-[#f72565] text-sm font-black text-[#f72565]"
              >
                Back to Plans
              </button>
              <button
                disabled={busy === selectedPlan.id}
                onClick={() => pay(selectedPlan)}
                className="pink-gradient h-11 rounded-full text-sm font-black text-white disabled:opacity-60"
              >
                {busy === selectedPlan.id ? "Creating..." : `Pay Now ₹${selectedPrice}`}
              </button>
            </div>
          </article>
        )}

        {step === "status" && (
          <article className="rounded-[22px] border border-zinc-200 bg-white p-3">
            <div className={`rounded-xl p-3 ${
              paymentStatus?.type === "success"
                ? "bg-emerald-50"
                : paymentStatus?.type === "error"
                ? "bg-red-50"
                : "bg-[#fff7fb]"
            }`}>
              <h3 className="text-lg font-black text-zinc-900">{paymentStatus?.title || "Payment status"}</h3>
              <p className="mt-1 text-sm font-semibold text-zinc-600">{paymentStatus?.body || "Check your payment status."}</p>
              {manualPayment?.orderId && (
                <p className="mt-2 text-xs font-black text-zinc-500">Order ID: {manualPayment.orderId}</p>
              )}
            </div>

            {manualPayment?.account?.upiId && (
              <p className="mt-2 rounded-xl bg-zinc-100 p-2 text-sm font-black text-zinc-700">
                UPI ID: {manualPayment.account.upiId}
              </p>
            )}

            {manualPayment?.account?.qrImage && (
              <img src={manualPayment.account.qrImage} alt="UPI QR" className="mt-2 h-28 w-28 rounded-xl object-cover" />
            )}

            {manualPayment?.fallbackPaymentUrl && (
              <a
                href={manualPayment.fallbackPaymentUrl}
                target="_blank"
                rel="noreferrer"
                className="pink-gradient mt-2 inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-black text-white"
              >
                Open Secure Payment Link
              </a>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep("plan")}
                className="h-11 rounded-full border border-[#f72565] text-sm font-black text-[#f72565]"
              >
                Choose Another Plan
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="pink-gradient h-11 rounded-full text-sm font-black text-white"
              >
                Go to Profile
              </button>
            </div>
          </article>
        )}

        <div className="mt-2 text-center text-xs font-semibold text-zinc-500 md:text-sm">
          100% Secure Payments Powered by <span className="font-black text-[#1142a7]">Razorpay</span>
        </div>

        <div className="mt-2 hidden grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-center text-xs md:grid md:grid-cols-4">
          <div>
            <p className="font-black text-zinc-800">Secure</p>
            <p className="font-medium text-zinc-500">256-bit SSL</p>
          </div>
          <div>
            <p className="font-black text-zinc-800">Cancel Anytime</p>
            <p className="font-medium text-zinc-500">No Questions</p>
          </div>
          <div>
            <p className="font-black text-zinc-800">Trusted by</p>
            <p className="font-medium text-zinc-500">1M+ Users</p>
          </div>
          <div>
            <p className="font-black text-zinc-800">24/7 Support</p>
            <p className="font-medium text-zinc-500">Help Ready</p>
          </div>
        </div>
      </div>
    </section>
  );
}
