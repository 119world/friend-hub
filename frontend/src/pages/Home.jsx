import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { profile } = useAuth();
  return (
    <section className="space-y-5 p-5">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-white to-blush px-1 pb-4 pt-2">
        <p className="text-sm font-semibold text-roseDeep">Welcome back</p>
        <h1 className="mt-1 text-3xl font-black">Hi {profile?.name || "Friend"}.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Discover verified partners and Friend Hub profiles. Chat starts simple, recharge when free replies are finished.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/discovery" className="rounded-2xl bg-white p-4 text-center shadow-soft">
          <Sparkles className="mx-auto text-roseDeep" />
          <span className="mt-2 block text-xs font-semibold">Discover</span>
        </Link>
        <Link to="/matches" className="rounded-2xl bg-white p-4 text-center shadow-soft">
          <MessageCircle className="mx-auto text-roseDeep" />
          <span className="mt-2 block text-xs font-semibold">Chats</span>
        </Link>
        <Link to="/recharge" className="rounded-2xl bg-white p-4 text-center shadow-soft">
          <Wallet className="mx-auto text-roseDeep" />
          <span className="mt-2 block text-xs font-semibold">{profile?.diamonds || 0} Diamonds</span>
        </Link>
      </div>

      <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold">MVP Features</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p>Firebase Auth login, Firestore chat, profile discovery, Friend Hub badges, recharge plans, voice button, and admin-controlled limits.</p>
          <p className="font-semibold text-roseDeep">Voice option is simple and recharge-based.</p>
        </div>
      </section>
    </section>
  );
}
