import { useLocation } from "react-router-dom";
import api from "../services/api";

const plans = [
  { id: "first_9", title: "First-time Offer", originalPrice: 19, price: 9, diamonds: 30, minutes: 1 },
  { id: "offer_49", title: "Friend Offer", originalPrice: 99, price: 49, diamonds: 160, minutes: 4 },
  { id: "premium_99", title: "Premium Offer", originalPrice: 199, price: 99, diamonds: 360, minutes: 10 },
  { id: "normal_19", title: "Starter", originalPrice: 19, price: 19, diamonds: 50, minutes: 1 },
  { id: "normal_99", title: "Popular", originalPrice: 99, price: 99, diamonds: 300, minutes: 8 },
  { id: "normal_299", title: "Premium", originalPrice: 299, price: 299, diamonds: 1000, minutes: 30 }
];

export default function Recharge() {
  const location = useLocation();
  async function pay(plan) {
    const { data } = await api.post("/payments/create-order", { planId: plan.id, amount: plan.price });
    if (!window.Razorpay) {
      alert(`Order created. Razorpay script is missing. Order ID: ${data.orderId}`);
      return;
    }
    const rz = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: "INR",
      name: "Friend Hub",
      description: plan.title,
      order_id: data.orderId,
      handler: () => alert("Payment captured. Wallet updates after webhook verification.")
    });
    rz.open();
  }

  return (
    <section className="space-y-4 p-5">
      <header>
        <p className="text-sm font-semibold text-roseDeep">Recharge</p>
        <h1 className="text-3xl font-black">Diamonds & minutes</h1>
        {location.state?.reason && <p className="mt-2 rounded-xl bg-blush p-3 text-sm text-roseDeep">{location.state.reason}</p>}
      </header>
      {plans.map((plan) => {
        const discount = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
        return (
          <article key={plan.id} className="rounded-3xl border border-pink-100 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{plan.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.diamonds} diamonds + {plan.minutes} voice minutes</p>
              </div>
              {discount > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{discount}% OFF</span>}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p><span className="text-sm text-slate-400 line-through">₹{plan.originalPrice}</span> <span className="text-2xl font-black text-roseDeep">₹{plan.price}</span></p>
              <button onClick={() => pay(plan)} className="rounded-xl bg-roseSoft px-4 py-3 font-semibold text-white">Recharge Now</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
