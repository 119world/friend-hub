import { Link } from "react-router-dom";
import { MessageCircle, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { profile } = useAuth();
  return (
    <section className="space-y-5 p-5">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-white to-blush px-1 pb-4 pt-2">
        <p className="text-sm font-semibold text-roseDeep">Friend Hub</p>
        <h1 className="mt-1 text-3xl font-black">Meet New Friends. Build Real Connections.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Friend Hub is a social networking platform where users can discover people, chat safely, and build interest-based friendships.</p>
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
        <h2 className="text-lg font-bold">Community Features</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p>Firebase Auth login, Firestore chat, profile discovery, Friend Hub badges, recharge plans, voice button, moderation, and admin-controlled safety limits.</p>
          <p className="font-semibold text-roseDeep">Recharge credits support premium social features only.</p>
        </div>
      </section>
    </section>
  );
}
