import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  CreditCard,
  Headset,
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
  normal_19: ["500 Diamonds", "Chatting", "See Who Likes You", "Profile Visitors"],
  offer_49: ["3000 Diamonds", "Chatting", "Advanced Filters", "Unlimited Likes", "Premium Support"],
  premium_99: ["1500 Diamonds Per Day (30 Days)", "Chatting", "Advanced Filters", "Unlimited Likes", "Daily Rewards"]
};

const PLAN_BADGE = {
  offer_49: "Best Value",
  premium_99: "Most Popular"
};

export default function Recharge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyWalletCredit } = useAuth();

  const [plans, setPlans] = useState(defaultPlans);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [manualPayment, setManualPayment] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlans[0]?.id || "");
  const [payMethod, setPayMethod] = useState("UPI");

  useEffect(() => listenPlans(setPlans), []);
  useEffect(() => {
    if (!selectedPlanId && plans.length) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  const displayPlans = useMemo(() => plans.slice(0, 4), [plans]);
  const selectedPlan = useMemo(
    () => displayPlans.find((item) => item.id === selectedPlanId) || displayPlans[0],
    [displayPlans, selectedPlanId]
  );

  const selectedPrice = Number(selectedPlan?.price || selectedPlan?.amount || 0);
  const selectedOriginal = Number(selectedPlan?.originalPrice || selectedPrice || 0);
  const discountValue = Math.max(0, selectedOriginal - selectedPrice);
  const discountPercent = selectedOriginal > 0 ? Math.round((discountValue / selectedOriginal) * 100) : 0;

  async function pay(plan) {
    setError("");
    setBusy(plan.id);
    try {
      const { data } = await api.post("/payments/create-order", { planId: plan.id, payMethod });
      if (data.manual) {
        setManualPayment({ plan, ...data });
        if (data.fallbackPaymentUrl) window.open(data.fallbackPaymentUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (data.demo || !window.Razorpay) {
        setManualPayment({ plan, ...data, demo: true });
        if (data.fallbackPaymentUrl) window.open(data.fallbackPaymentUrl, "_blank", "noopener,noreferrer");
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
          const { data: verified } = await api.post("/payments/verify", response);
          applyWalletCredit(verified.plan);
          alert("Payment verified. Diamonds added.");
        }
      });
      rz.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setBusy("");
    }
  }

  const paymentMethods = [
    {
      key: "UPI",
      title: "UPI",
      sub: "Pay using any UPI app",
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6 w-auto object-contain" />
    },
    {
      key: "Cards",
      title: "Debit / Credit Card",
      sub: "Visa, Mastercard, RuPay & more",
      icon: <CreditCard size={27} className="text-[#1d1d21]" />
    },
    {
      key: "Wallets",
      title: "Wallets",
      sub: "Paytm, PhonePe, Amazon Pay & more",
      icon: <Wallet size={27} className="text-[#1d1d21]" />
    }
  ];

  return (
    <section className="phone-page px-3 pb-28 pt-3">
      <div className="rounded-[28px] border border-zinc-200 bg-[#faf9fc] p-3">
        <header className="mb-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2">
          <button onClick={() => navigate(-1)} className="rounded-xl bg-zinc-100 p-2" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-black leading-none text-[#121a36]">Friend <span className="text-[#f72565]">Hub</span></h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-zinc-500">
              <ShieldCheck size={14} /> Secure & Encrypted Payment
            </p>
          </div>
          <button className="rounded-xl bg-[#fff1f7] px-3 py-2 text-sm font-black text-[#f72565]">
            <span className="inline-flex items-center gap-1"><Headset size={15} /> Need Help?</span>
          </button>
        </header>

        <article className="rounded-[22px] border border-zinc-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-[#fff7fb] px-3 py-2">
            <h2 className="text-2xl font-black text-[#111626]">Choose Your Plan</h2>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-[#f72565]">Limited Time Offer</span>
              <span className="text-sm font-black text-emerald-600">You save upto 75%</span>
            </div>
          </div>

          <div className="grid gap-3">
            {displayPlans.map((plan) => {
              const price = Number(plan.price || plan.amount);
              const original = Number(plan.originalPrice || price);
              const discount = Math.max(0, original - price);
              const percent = original > 0 ? Math.round((discount / original) * 100) : 0;
              const active = plan.id === selectedPlanId;
              const features = PLAN_FEATURES[plan.id] || ["Chatting", "Premium Discovery", "Priority replies"];
              const badge = PLAN_BADGE[plan.id];
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-[20px] border bg-white p-3 ${
                    active ? "border-[#f72565] shadow-[0_12px_25px_rgba(247,37,101,.15)]" : "border-zinc-200"
                  }`}
                >
                  {badge && (
                    <span className="absolute -left-1 top-2 rounded-r-lg bg-[#f72565] px-3 py-1 text-xs font-black text-white">
                      {badge}
                    </span>
                  )}
                  <div className="grid gap-3 md:grid-cols-[140px_1fr_150px] md:items-center">
                    <div className="text-center md:border-r md:border-zinc-200 md:pr-3">
                      {original > price && <p className="text-lg font-black text-zinc-500 line-through">₹{original}</p>}
                      <p className="text-5xl font-black leading-none text-[#f72565]">₹{price}</p>
                      <p className="mt-1 inline-block rounded-full bg-[#ffe5f1] px-2 py-0.5 text-sm font-black text-[#f72565]">DISCOUNT {discount}</p>
                      <p className="mt-1 text-lg font-black text-emerald-600">You save {percent}%</p>
                    </div>

                    <ul className="space-y-1.5 text-sm leading-tight text-zinc-800">
                      {features.map((line) => (
                        <li key={line} className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="shrink-0 text-[#f72565]" />
                          <span className="font-semibold">{line}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-center md:justify-end">
                      <button
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`rounded-2xl border px-6 py-3 text-lg font-black ${
                          active ? "pink-gradient border-[#f72565] text-white" : "border-[#f72565] text-[#f72565]"
                        }`}
                      >
                        Choose Plan
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="mt-3 rounded-[22px] border border-zinc-200 bg-white p-3">
          <h3 className="text-2xl font-black text-[#111626]">Pay With</h3>
          <div className="mt-2 grid gap-2">
            {paymentMethods.map((method) => {
              const active = method.key === payMethod;
              return (
                <button
                  key={method.key}
                  onClick={() => setPayMethod(method.key)}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-3 ${
                    active ? "border-[#f72565] bg-[#fff7fb]" : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="grid h-11 w-16 place-items-center rounded-xl bg-zinc-50">{method.icon}</div>
                    <div>
                          <p className="text-lg font-black text-zinc-900">{method.title}</p>
                          <p className="text-sm font-medium text-zinc-500">{method.sub}</p>
                    </div>
                  </div>
                  {active ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f72565] text-white">
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
                      Secured <Lock size={13} className="ml-1 mt-[2px]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        {selectedPlan && (
          <article className="mt-3 rounded-[22px] border border-zinc-200 bg-white p-3">
            <div className="flex items-center gap-2 text-zinc-900">
              <BadgeCheck size={19} className="text-[#f72565]" />
              <h4 className="text-xl font-black">Order Summary</h4>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-500">Plan Amount</span>
                <span className="font-semibold text-zinc-700">₹{selectedOriginal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-600">Discount ({discountPercent}%)</span>
                <span className="font-black text-emerald-600">- ₹{discountValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-zinc-200 pt-2">
              <span className="text-2xl font-black text-zinc-900">Total Amount</span>
              <span className="text-4xl font-black text-[#f72565]">₹{selectedPrice.toFixed(2)}</span>
            </div>
          </article>
        )}

        {location.state?.reason && (
          <p className="mt-3 rounded-xl bg-blush p-3 text-base font-semibold text-roseDeep">{location.state.reason}</p>
        )}
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-base font-semibold text-red-600">{error}</p>}

        {manualPayment && (
          <article className="mt-3 rounded-[20px] border border-rose-200 bg-white p-3">
            <p className="text-sm font-black text-roseDeep">
              {manualPayment.demo ? "Demo / setup mode" : "Manual UPI payment"} | Order: {manualPayment.orderId}
            </p>
            {manualPayment.account?.qrImage && (
              <img src={manualPayment.account.qrImage} alt="UPI QR" className="mt-2 h-28 w-28 rounded-xl object-cover" />
            )}
              {manualPayment.account?.upiId && (
              <p className="mt-2 rounded-xl bg-slate-50 p-2 text-sm font-black text-slate-700">UPI ID: {manualPayment.account.upiId}</p>
            )}
            {manualPayment.fallbackPaymentUrl && (
              <a
                href={manualPayment.fallbackPaymentUrl}
                target="_blank"
                rel="noreferrer"
                className="pink-gradient mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black text-white"
              >
                Pay via Razorpay Link
              </a>
            )}
          </article>
        )}

        {selectedPlan && (
          <button
            disabled={busy === selectedPlan.id}
            onClick={() => pay(selectedPlan)}
            className="pink-gradient mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-4 text-2xl font-black text-white shadow-[0_16px_28px_rgba(247,37,101,.28)] disabled:opacity-60"
          >
            <Lock size={18} />
            {busy === selectedPlan.id ? "Creating..." : `Pay Securely ₹${selectedPrice}`}
          </button>
        )}

        <div className="mt-2 text-center text-sm font-semibold text-zinc-500">
          100% Secure Payments Powered by{" "}
          <span className="font-black text-[#1142a7]">Razorpay</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 text-center text-xs md:grid-cols-4">
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
