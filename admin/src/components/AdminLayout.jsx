import { Bell, Bot, ChevronDown, CreditCard, Database, Heart, Home, Image, KeyRound, MessageCircle, Phone, Repeat, Search, Settings, ShieldCheck, Tags, UserRound, Wallet } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/users", label: "Users", icon: UserRound },
  { to: "/partners", label: "Partners", icon: ShieldCheck },
  { to: "/bots", label: "AI Bots", icon: Bot },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/plans", label: "Plans", icon: Wallet },
  { to: "/offers", label: "Offers", icon: Tags },
  { to: "/media", label: "Media", icon: Image },
  { to: "/banks", label: "Banks", icon: Database },
  { to: "/payment-accounts", label: "Gateways", icon: CreditCard },
  { to: "/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/admin-accounts", label: "Admin Login", icon: KeyRound },
  { to: "/partner-accounts", label: "Partner Login", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/templates", label: "Templates", icon: Settings },
  { to: "/auto-replies", label: "Auto Replies", icon: MessageCircle },
  { to: "/referrals", label: "Referrals", icon: Tags },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/calls", label: "Calls", icon: Phone }
];

export default function AdminLayout() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] lg:flex">
      <aside className="bg-[#090f3f] p-5 text-white lg:fixed lg:bottom-0 lg:left-0 lg:top-0 lg:w-72">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff3f8d] to-[#7c3cff]">
            <Heart size={26} fill="white" strokeWidth={0} />
          </span>
          <h1 className="text-2xl font-black">Friend Hub</h1>
        </div>
        <nav className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-white/14 text-white shadow-lg shadow-purple-950/20" : "text-white/75 hover:bg-white/8 hover:text-white"}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-2xl bg-white/10 p-4 lg:flex lg:items-center lg:gap-3">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" className="h-11 w-11 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Admin User</p>
            <p className="text-xs text-white/60">Super Admin</p>
          </div>
          <ChevronDown size={18} />
        </div>
      </aside>
      <section className="flex-1 p-4 lg:ml-72 lg:p-8">
        <header className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-3xl font-black text-[#11162e]">Welcome back, Admin!</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Here is what is happening with Friend Hub today.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="hidden h-12 min-w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-400 shadow-sm md:flex">
              <Search size={19} />
              <input placeholder="Search anything..." className="w-full bg-transparent text-sm outline-none" />
            </label>
            <button className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
              <Bell size={21} />
              <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#ff2f7e] text-[10px] font-black text-white">8</span>
            </button>
          </div>
        </header>
        <Outlet />
      </section>
    </main>
  );
}
