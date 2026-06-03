import { useEffect, useState } from "react";
import { Activity, CreditCard, MessageCircle, Phone, Users, UserRound, Wallet, XCircle } from "lucide-react";
import adminApi from "../services/adminApi";

const spark = [18, 26, 22, 34, 27, 31, 25, 40, 36, 48];

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    adminApi.get("/admin/dashboard").then(({ data }) => setStats(data)).catch(() => setStats({}));
  }, []);

  const cards = [
    ["Total Users", stats.usersTotal || "24,589", "12.5%", UserRound, "text-[#7c3cff]", "bg-purple-100"],
    ["Active Users", stats.activeUsers || "8,742", "18.6%", Users, "text-emerald-500", "bg-emerald-100"],
    ["New Signups", stats.newUsers || "1,253", "9.8%", Activity, "text-blue-500", "bg-blue-100"],
    ["Total Chats", stats.chatsTotal || "15,890", "16.3%", MessageCircle, "text-[#ff2f7e]", "bg-pink-100"],
    ["Revenue", `INR ${stats.lifetimeReceived || "32,450"}`, "20.4%", Wallet, "text-amber-500", "bg-amber-100"]
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-5">
        {cards.map(([label, value, change, Icon, color, bg], index) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
            <div className="flex items-center gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${bg} ${color}`}><Icon size={28} /></span>
              <div>
                <p className="text-sm font-bold text-slate-600">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#11162e]">{value}</p>
                <p className="mt-1 text-xs font-black text-emerald-500">Up {change}</p>
              </div>
            </div>
            <div className="mt-5 flex h-10 items-end gap-1">
              {spark.map((height, sparkIndex) => (
                <span key={`${label}-${sparkIndex}`} className={`flex-1 rounded-full bg-current ${color}`} style={{ height: `${height + index * 2}%`, opacity: 0.25 + sparkIndex / 20 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.82fr_.95fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#11162e]">User Growth</h3>
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Last 7 Days</span>
          </div>
          <div className="mt-8 h-64 rounded-2xl bg-gradient-to-t from-purple-100 to-white p-5">
            <div className="flex h-full items-end justify-between gap-4">
              {[28, 40, 52, 62, 71, 82, 92].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <div className="w-full rounded-t-xl bg-[#7c3cff]" style={{ height: `${height}%` }} />
                  <span className="text-xs font-semibold text-slate-500">May {10 + index}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Platform Health</h3>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-44 w-44 place-items-center rounded-full border-[20px] border-emerald-400 border-l-pink-400 border-t-amber-300">
              <span className="text-center text-3xl font-black">68%<span className="block text-sm font-semibold text-slate-500">Active</span></span>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm font-semibold">
            <p className="flex justify-between"><span>Total calls</span><span>{stats.callsTotal || 0}</span></p>
            <p className="flex justify-between"><span>Failed payments</span><span>{stats.failedPayments || 0}</span></p>
            <p className="flex justify-between"><span>API usage</span><span>{stats.apiUsage || 0}</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#11162e]">Recent Signups</h3>
            <span className="text-xs font-black text-[#ff2f7e]">View All</span>
          </div>
          <div className="mt-5 space-y-4">
            {["Emma Johnson", "Liam Smith", "Olivia Brown", "Noah Davis", "Sophia Wilson"].map((name, index) => (
              <div key={name} className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/80?img=${index + 20}`} className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#11162e]">{name}</p>
                  <p className="truncate text-xs text-slate-500">friendhub119@gmail.com</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Recent Activities</h3>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            {[
              [UserRound, "New User Registered", "Ava Martinez", "2 min ago"],
              [Users, "New Connection Created", "Interest-based chat", "5 min ago"],
              [CreditCard, "Recharge Completed", "Premium Plan", "15 min ago"],
              [Phone, "Video Call Started", "Ananya", "22 min ago"],
              [XCircle, "Payment Failed", "Retry needed", "35 min ago"]
            ].map(([Icon, activity, detail, time], index) => (
              <div key={activity} className="grid grid-cols-[1.4fr_1fr_.8fr] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                <p className="flex items-center gap-3 text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blush text-roseDeep"><Icon size={17} /></span>{activity}</p>
                <p className="text-sm text-slate-600">{detail}</p>
                <p className="text-right text-sm text-slate-500">{time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Payment Routing</h3>
          <div className="mt-5 grid gap-3">
            {[
              ["Today received", `INR ${stats.todayReceived || 0}`],
              ["Week received", `INR ${stats.weekReceived || 0}`],
              ["Month received", `INR ${stats.monthReceived || 0}`],
              ["Remaining limit", `INR ${stats.remainingLimit || 0}`],
              ["Active account", stats.activePaymentAccount || "Not set"]
            ].map(([label, value]) => (
              <p key={label} className="flex justify-between rounded-xl bg-[#f7f9ff] px-4 py-3 text-sm font-bold">
                <span className="text-slate-500">{label}</span>
                <span className="text-[#11162e]">{value}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
