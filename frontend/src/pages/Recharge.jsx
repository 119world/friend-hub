import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { defaultPlans, listenPlans } from "../services/appConfig";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

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

  const selectedPlan = useMemo(
    () => plans.find((item) => item.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
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
        return;
      }
      if (data.demo || !window.Razorpay) {
        setManualPayment({ plan, ...data, demo: true });
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
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-7 w-auto object-contain" />
    },
    {
      key: "Cards",
      title: "Debit / Credit Card",
      sub: "Visa, Mastercard, Rupay & more",
      icon: <CreditCard size={28} className="text-zinc-800" />
    },
    {
      key: "Wallets",
      title: "Wallets",
      sub: "Paytm, PhonePe, Amazon Pay & more",
      icon: <Wallet size={28} className="text-zinc-800" />
    },
    {
      key: "Netbanking",
      title: "Netbanking",
      sub: "All major Indian banks",
      icon: <ShieldCheck size={28} className="text-zinc-800" />
    },
    {
      key: "QR",
      title: "QR",
      sub: "Scan and pay instantly",
      icon: <QrCode size={28} className="text-zinc-800" />
    }
  ];

  const displayPlans = plans.slice(0, 3);

  return (
    <section className="phone-page px-0 pb-8">
      <div className="mx-4 mt-4 overflow-hidden rounded-[34px] border border-zinc-200 bg-[#f7f6fa] shadow-soft">
        <div className="px-5 pb-5 pt-4">
          <div className="rounded-[28px] bg-gradient-to-r from-[#ff4f98] to-[#ff8f7a] px-4 pb-4 pt-3 text-white">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="rounded-full bg-white/25 p-2 text-white"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-black leading-tight">Friend Hub</h1>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">
                  <ShieldCheck size={14} /> Secure Payment
                </p>
              </div>
              <span className="w-8" />
            </div>
          </div>

          <div className="-mt-1 rounded-[28px] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#17171b]">Choose Your Plan</h2>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-[#f72565]">Best Value</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {displayPlans.map((plan, index) => {
                const price = Number(plan.price || plan.amount);
                const original = Number(plan.originalPrice || price);
                const active = selectedPlanId === plan.id;
                const duration = index === 0 ? "7 Days" : index === 1 ? "30 Days" : "90 Days";
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-[20px] border px-2 py-4 text-center transition ${
                      active
                        ? "border-[#f72565] bg-gradient-to-b from-rose-50 to-white shadow-[0_8px_24px_rgba(247,37,101,0.18)]"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {active && (
                      <span className="mb-2 inline-block rounded-full bg-[#f72565] px-2 py-1 text-[10px] font-black text-white">
                        Most Popular
                      </span>
                    )}
                    <p className="text-[22px] font-black leading-none text-zinc-900">₹{price}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{plan.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-zinc-400">{duration}</p>
                    {original > price && (
                      <p className="mt-2 text-sm font-semibold text-zinc-400 line-through">₹{original}</p>
                    )}
                    <div className="mt-2">
                      {active ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f72565] text-white">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-block h-6 w-6 rounded-full border border-zinc-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2 text-sm">
              <span className="font-black text-[#f72565]">Limited Time Offer</span>
              <span className="font-black text-emerald-600">You save ₹{discountValue} ({discountPercent}%)</span>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-200 p-4">
              <h3 className="text-2xl font-black text-[#17171b]">Pay With</h3>
              <div className="mt-3 grid gap-2">
                {paymentMethods.map((method) => {
                  const active = payMethod === method.key;
                  return (
                    <button
                      key={method.key}
                      onClick={() => setPayMethod(method.key)}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                        active ? "border-[#f72565] bg-rose-50/70" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-16 place-items-center rounded-xl bg-zinc-50">{method.icon}</div>
                        <div>
                          <p className="text-[17px] font-black text-zinc-900">{method.title}</p>
                          <p className="text-sm font-medium text-zinc-500">{method.sub}</p>
                        </div>
                      </div>
                      {active ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f72565] text-white">
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlan && (
              <article className="mt-4 rounded-3xl border border-zinc-200 p-4">
                <div className="flex items-center gap-2 text-zinc-900">
                  <BadgeCheck size={18} className="text-[#f72565]" />
                  <h4 className="text-xl font-black">Order Summary</h4>
                </div>
                <div className="mt-3 space-y-2 text-base">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Plan</span>
                    <span className="font-semibold text-zinc-800">{selectedPlan.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Original Price</span>
                    <span className="font-semibold text-zinc-400 line-through">₹{selectedOriginal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600">Discount ({discountPercent}%)</span>
                    <span className="font-semibold text-emerald-600">- ₹{discountValue}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                  <p className="text-2xl font-black text-zinc-900">Total Amount</p>
                  <p className="text-4xl font-black text-[#f72565]">₹{selectedPrice}</p>
                </div>
              </article>
            )}

            {location.state?.reason && (
              <p className="mt-3 rounded-xl bg-blush p-3 text-sm font-semibold text-roseDeep">{location.state.reason}</p>
            )}
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>
            )}

            {manualPayment && (
              <article className="mt-4 rounded-3xl border border-rose-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-roseDeep">
                      {manualPayment.demo ? "Demo / setup mode" : "Manual UPI payment"}
                    </p>
                    <p className="text-sm font-semibold text-slate-600">Order: {manualPayment.orderId}</p>
                  </div>
                  <QrCode className="text-roseDeep" size={22} />
                </div>
                {manualPayment.account?.qrImage && (
                  <img
                    src={manualPayment.account.qrImage}
                    alt="UPI QR"
                    className="mt-3 aspect-square w-40 rounded-2xl object-cover"
                  />
                )}
                {manualPayment.account?.upiId && (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-black text-slate-700">
                    UPI ID: {manualPayment.account.upiId}
                  </p>
                )}
              </article>
            )}

            {selectedPlan && (
              <button
                disabled={busy === selectedPlan.id}
                onClick={() => pay(selectedPlan)}
                className="pink-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-2xl font-black text-white shadow-[0_14px_30px_rgba(247,37,101,0.35)] disabled:opacity-60"
              >
                <Lock size={18} />
                {busy === selectedPlan.id ? "Creating..." : `Pay Securely ₹${selectedPrice}`}
              </button>
            )}

            <p className="mt-3 text-center text-sm font-semibold text-zinc-500">
              100% secure payments powered by Razorpay
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 pb-1 text-center text-xs font-semibold text-zinc-500">
              <div className="rounded-xl bg-zinc-50 px-2 py-2">Secure Encryption</div>
              <div className="rounded-xl bg-zinc-50 px-2 py-2">Cancel Anytime</div>
              <div className="rounded-xl bg-zinc-50 px-2 py-2">Trusted by users</div>
              <div className="rounded-xl bg-zinc-50 px-2 py-2">24/7 Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
