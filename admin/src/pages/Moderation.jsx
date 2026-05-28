import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, CreditCard, Flag, RefreshCcw, ShieldAlert } from "lucide-react";
import adminApi from "../services/adminApi";

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700"
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

export default function Moderation() {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setMessage("");
    const [usersRes, chatsRes, paymentsRes, refundsRes] = await Promise.all([
      adminApi.get("/admin/users").catch(() => ({ data: { items: [] } })),
      adminApi.get("/admin/chats").catch(() => ({ data: { items: [] } })),
      adminApi.get("/admin/payments").catch(() => ({ data: { items: [] } })),
      adminApi.get("/admin/refundRequests").catch(() => ({ data: { items: [] } }))
    ]);
    setUsers(usersRes.data.items || []);
    setChats(chatsRes.data.items || []);
    setPayments(paymentsRes.data.items || []);
    setRefunds(refundsRes.data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  const reportedChats = useMemo(() => chats.filter((item) => item.reported === true || item.reported === "true"), [chats]);
  const blockedChats = useMemo(() => chats.filter((item) => item.blocked === true || item.blocked === "true"), [chats]);
  const manualPayments = useMemo(
    () => payments.filter((item) => ["manual_pending", "manual_submitted", "demo_created", "created"].includes(item.status)),
    [payments]
  );

  async function suspendUser(user) {
    if (!user?.id && !user?.uid) return;
    const id = user.id || user.uid;
    setBusy(`suspend-${id}`);
    try {
      await adminApi.patch(`/admin/users/${id}`, { active: false, suspended: true });
      setMessage("User suspended.");
      await load();
    } finally {
      setBusy("");
    }
  }

  async function verifyPayment(payment) {
    const id = payment.id || payment.orderId;
    if (!id) return;
    setBusy(`payment-${id}`);
    try {
      await adminApi.post(`/admin/payments/${id}/verify-manual`);
      setMessage("Manual recharge verified and credits activated.");
      await load();
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-[#11162e]"><ShieldAlert className="text-[#ff2f7e]" /> Moderation</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Review reported users, blocked chats, manual recharge verification, and refund requests.</p>
        </div>
        <button onClick={load} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700">
          <RefreshCcw size={17} /> Refresh
        </button>
      </div>

      {message && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</p>}

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="flex items-center gap-2 text-lg font-black text-[#11162e]"><Flag size={19} /> Reported Users</h3>
          <div className="mt-4 space-y-3">
            {(reportedChats.length ? reportedChats : chats.slice(0, 3)).map((item) => (
              <div key={item.id || item.userId} className="rounded-xl bg-[#f7f9ff] p-3 text-sm">
                <p className="font-black text-slate-800">User: {item.userId || "Unknown"}</p>
                <p className="mt-1 font-semibold text-slate-500">Target: {item.targetId || "N/A"}</p>
                <StatusPill tone={item.reported ? "rose" : "slate"}>{item.reported ? "Reported" : "No active report"}</StatusPill>
              </div>
            ))}
            {!chats.length && <p className="text-sm font-semibold text-slate-500">No reported chat records yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="flex items-center gap-2 text-lg font-black text-[#11162e]"><Ban size={19} /> Blocked Users</h3>
          <div className="mt-4 space-y-3">
            {(blockedChats.length ? blockedChats : chats.slice(0, 3)).map((item) => (
              <div key={item.id || item.targetId} className="rounded-xl bg-[#f7f9ff] p-3 text-sm">
                <p className="font-black text-slate-800">User: {item.userId || "Unknown"}</p>
                <p className="mt-1 font-semibold text-slate-500">Target: {item.targetId || "N/A"}</p>
                <StatusPill tone={item.blocked ? "rose" : "slate"}>{item.blocked ? "Blocked" : "Not blocked"}</StatusPill>
              </div>
            ))}
            {!chats.length && <p className="text-sm font-semibold text-slate-500">No blocked chat records yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="flex items-center gap-2 text-lg font-black text-[#11162e]"><ShieldAlert size={19} /> Suspend User</h3>
          <div className="mt-4 space-y-3">
            {users.slice(0, 5).map((user) => {
              const id = user.id || user.uid;
              return (
                <div key={id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9ff] p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-800">{user.name || id}</p>
                    <StatusPill tone={user.active === false ? "rose" : "emerald"}>{user.active === false ? "Suspended" : "Active"}</StatusPill>
                  </div>
                  <button
                    disabled={busy === `suspend-${id}` || user.active === false}
                    onClick={() => suspendUser(user)}
                    className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"
                  >
                    Suspend
                  </button>
                </div>
              );
            })}
            {!users.length && <p className="text-sm font-semibold text-slate-500">No users loaded.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="flex items-center gap-2 text-lg font-black text-[#11162e]"><CreditCard size={19} /> Payment Verification / Recharge History</h3>
          <div className="mt-4 space-y-3">
            {(manualPayments.length ? manualPayments : payments.slice(0, 6)).map((payment) => {
              const id = payment.id || payment.orderId;
              const pending = ["manual_pending", "manual_submitted", "demo_created", "created"].includes(payment.status);
              return (
                <div key={id} className="rounded-xl bg-[#f7f9ff] p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-800">Order: {payment.orderId || id}</p>
                      <p className="mt-1 font-semibold text-slate-500">INR {payment.amount || 0} | Txn: {payment.manualTransactionId || payment.paymentId || "Pending"}</p>
                    </div>
                    <StatusPill tone={payment.status === "paid" ? "emerald" : pending ? "amber" : "slate"}>{payment.status || "created"}</StatusPill>
                  </div>
                  {pending && (
                    <button
                      disabled={busy === `payment-${id}`}
                      onClick={() => verifyPayment(payment)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 disabled:opacity-50"
                    >
                      <BadgeCheck size={15} /> Verify & Activate Credits
                    </button>
                  )}
                </div>
              );
            })}
            {!payments.length && <p className="text-sm font-semibold text-slate-500">No recharge records yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Refund Request List</h3>
          <div className="mt-4 space-y-3">
            {refunds.map((refund) => (
              <div key={refund.id || refund.orderId} className="rounded-xl bg-[#f7f9ff] p-3 text-sm">
                <p className="font-black text-slate-800">Order: {refund.orderId || refund.paymentId || refund.id}</p>
                <p className="mt-1 font-semibold text-slate-500">Reason: {refund.reason || "Not provided"}</p>
                <StatusPill tone={refund.status === "approved" ? "emerald" : "amber"}>{refund.status || "pending"}</StatusPill>
              </div>
            ))}
            {!refunds.length && <p className="text-sm font-semibold text-slate-500">No refund requests yet.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
