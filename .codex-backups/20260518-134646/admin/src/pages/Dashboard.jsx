import { useEffect, useState } from "react";
import { Heart, Users, UserRound, Wallet } from "lucide-react";
import adminApi from "../services/adminApi";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => {
    adminApi.get("/admin/dashboard").then(({ data }) => setStats(data)).catch(() => setStats({}));
  }, []);
  const cards = [
    ["Total Users", "24,589", "12.5%", UserRound, "text-[#7c3cff]", "bg-purple-100"],
    ["Active Users", "8,742", "18.6%", Users, "text-emerald-500", "bg-emerald-100"],
    ["Total Matches", "15,890", "16.3%", Heart, "text-[#ff2f7e]", "bg-pink-100"],
    ["Revenue", `₹${stats.lifetimeReceived || 0}`, "20.4%", Wallet, "text-amber-500", "bg-amber-100"]
  ];
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map(([label, value, change, Icon, color, bg]) => (
          <div key={label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
            <div className="flex items-center gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${bg} ${color}`}><Icon size={28} /></span>
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#11162e]">{value} <span className="text-xs font-black text-emerald-500">↑ {change}</span></p>
                <p className="mt-1 text-xs text-slate-400">vs last month</p>
              </div>
            </div>
            <div className={`mt-6 h-10 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-30 ${color}`} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.8fr_.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
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

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Payment Routing</h3>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-40 w-40 place-items-center rounded-full border-[18px] border-emerald-400 border-l-pink-400 border-t-amber-300">
              <span className="text-3xl font-black">68%</span>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm font-semibold">
            <p className="flex justify-between"><span>Today received</span><span>₹{stats.todayReceived || 0}</span></p>
            <p className="flex justify-between"><span>Remaining limit</span><span>₹{stats.remainingLimit || 0}</span></p>
            <p className="flex justify-between"><span>Active account</span><span>{stats.activePaymentAccount || "Not set"}</span></p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <h3 className="text-lg font-black text-[#11162e]">Recent Signups</h3>
          <div className="mt-5 space-y-4">
            {["Emma Johnson", "Liam Smith", "Olivia Brown", "Noah Davis"].map((name, index) => (
              <div key={name} className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/80?img=${index + 20}`} className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#11162e]">{name}</p>
                  <p className="truncate text-xs text-slate-500">{name.toLowerCase().replace(" ", ".")}@gmail.com</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
        <h3 className="text-lg font-black text-[#11162e]">System Overview</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            ["Week received", `₹${stats.weekReceived || 0}`],
            ["Month received", `₹${stats.monthReceived || 0}`],
            ["Year received", `₹${stats.yearReceived || 0}`],
            ["Lifetime received", `₹${stats.lifetimeReceived || 0}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f7f9ff] p-4">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-black text-[#11162e]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
