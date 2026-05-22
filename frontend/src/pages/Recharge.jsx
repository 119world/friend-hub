import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, QrCode, Repeat, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { defaultPlans, listenPlans } from "../services/appConfig";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Recharge() {
  const location = useLocation();
  const { applyWalletCredit } = useAuth();
  const [plans, setPlans] = useState(defaultPlans);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [manualPayment, setManualPayment] = useState(null);

  useEffect(() => listenPlans(setPlans), []);

  async function pay(plan) {
    setError("");
    setBusy(plan.id);
    try {
      const { data } = await api.post("/payments/create-order", { planId: plan.id });
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

  return (
    <section className="phone-page space-y-4 px-5">
      <header className="pt-3">
        <p className="text-sm font-semibold text-roseDeep">Recharge</p>
        <h1 className="text-3xl font-black">Diamonds & minutes</h1>
        {location.state?.reason && <p className="mt-2 rounded-xl bg-blush p-3 text-sm text-roseDeep">{location.state.reason}</p>}
        {error && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      </header>

      <div className="grid gap-4">
        <div className="rounded-[24px] bg-[#fff0f5] p-4">
          <p className="text-sm font-black text-roseDeep">India payment options</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black text-zinc-700">
            {["UPI", "QR", "Cards", "Netbanking", "Wallets", "Pay Later"].map((item) => (
              <span key={item} className="rounded-full bg-white px-2 py-2 shadow-sm">{item}</span>
            ))}
          </div>
        </div>

        {manualPayment && (
          <article className="rounded-[24px] border border-rose-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-roseDeep">{manualPayment.demo ? "Demo / setup mode" : "Manual UPI payment"}</p>
                <h2 className="mt-1 text-xl font-black">{manualPayment.plan.title}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Order: {manualPayment.orderId}</p>
              </div>
              <QrCode className="text-roseDeep" size={30} />
            </div>
            {manualPayment.account?.qrImage && <img src={manualPayment.account.qrImage} alt="UPI QR" className="mt-4 aspect-square w-44 rounded-2xl object-cover" />}
            {manualPayment.account?.upiId && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">UPI ID: {manualPayment.account.upiId}</p>}
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Live Razorpay keys add karne ke baad UPI, cards, netbanking, wallets aur pay-later checkout secure webhook se wallet credit karega.
            </p>
          </article>
        )}

        {plans.map((plan) => {
          const original = Number(plan.originalPrice || plan.price || plan.amount);
          const price = Number(plan.price || plan.amount);
          const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
          return (
            <article key={plan.id} className="rounded-[24px] border border-pink-100 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{plan.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{plan.diamonds} diamonds + {plan.minutes} voice minutes</p>
                </div>
                {discount > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{discount}% OFF</span>}
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p>
                  {discount > 0 && <span className="text-sm text-slate-400 line-through">INR {original}</span>}
                  <span className="ml-2 text-2xl font-black text-roseDeep">INR {price}</span>
                </p>
                <button disabled={busy === plan.id} onClick={() => pay(plan)} className="pink-gradient rounded-full px-4 py-3 font-black text-white disabled:opacity-60">
                  {busy === plan.id ? "Creating..." : "Recharge"}
                </button>
              </div>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-500">
                <p className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-500" /> Razorpay verified order flow</p>
                {plan.subscription && <p className="flex items-center gap-2"><Repeat size={17} className="text-[#f72565]" /> Subscription-ready plan</p>}
                {plan.autoPay && <p className="flex items-center gap-2"><Smartphone size={17} className="text-[#f72565]" /> Auto-pay architecture enabled</p>}
                <p className="flex items-center gap-2"><WalletCards size={17} className="text-emerald-500" /> India checkout: UPI, QR, card, netbanking, wallet</p>
                <p className="flex items-center gap-2"><Check size={17} className="text-[#f72565]" /> Admin can enable, disable, or discount this plan</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
