import { useState } from "react";
import { Flame, Heart, Phone } from "lucide-react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { user, loginGoogle, enterWithoutLogin, startPhoneLogin } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState({
    title: "Find Your Perfect Match",
    subtitle: "Join millions of people looking for meaningful connections.",
    bgPhoto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85"
  });

  useEffect(() => {
    getDoc(doc(db, "appSettings", "welcome"))
      .then((snap) => {
        if (snap.exists()) setWelcome((old) => ({ ...old, ...snap.data() }));
      })
      .catch(() => {});
  }, []);

  if (user) return <Navigate to="/" replace />;

  async function handleOtp() {
    setError("");
    try {
      if (!confirmation) {
        const result = await startPhoneLogin(phone);
        setConfirmation(result);
      } else {
        await confirmation.confirm(code);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGoogle() {
    setError("");
    const isDemoFirebase =
      import.meta.env.VITE_FIREBASE_PROJECT_ID === "demo" ||
      String(import.meta.env.VITE_FIREBASE_API_KEY || "").includes("demo");
    if (isDemoFirebase) {
      enterWithoutLogin({ name: "Google User" });
      return;
    }
    try {
      await loginGoogle();
    } catch {
      enterWithoutLogin({ name: "Google User" });
    }
  }

  return (
    <main
      className="app-shell relative min-h-screen overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `linear-gradient(180deg, rgba(238,35,106,.82) 0%, rgba(255,114,118,.38) 42%, rgba(0,0,0,.42) 100%), url('${welcome.bgPhoto || welcome.welcomeBgPhoto}')` }}
    >
      <section className="relative z-10 flex min-h-screen flex-col px-8 pb-9 pt-12">
        <div className="mb-20">
          <div className="relative mb-12 h-12 w-12">
            <Heart className="absolute left-0 top-0 text-white" size={46} fill="currentColor" strokeWidth={0} />
            <Flame className="absolute bottom-0 left-3 text-[#ff3f8d]" size={24} fill="currentColor" strokeWidth={0} />
          </div>
          <h1 className="max-w-[320px] text-[42px] font-black leading-[1.12] tracking-normal">{welcome.title}</h1>
          <p className="mt-6 max-w-[285px] text-[22px] font-medium leading-[1.35] text-white/92">{welcome.subtitle}</p>
        </div>

        <div className="mt-auto space-y-4">
          <button onClick={() => enterWithoutLogin()} className="pink-gradient h-16 w-full rounded-full text-lg font-black text-white shadow-2xl shadow-pink-700/25">
            Get Started
          </button>
          <button onClick={handleGoogle} className="flex h-16 w-full items-center justify-center gap-5 rounded-full bg-white text-lg font-bold text-zinc-900 shadow-xl">
            <span className="text-3xl font-black text-[#4285f4]">G</span> Continue with Google
          </button>
          <button onClick={() => setShowOtp((value) => !value)} className="flex h-16 w-full items-center justify-center gap-5 rounded-full bg-white text-lg font-bold text-zinc-900 shadow-xl">
            <Phone size={27} fill="currentColor" /> Continue with Mobile
          </button>
          {showOtp && (
            <div className="rounded-[28px] bg-white/95 p-4 text-zinc-900 shadow-xl">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 mobile number"
                className="w-full rounded-full bg-zinc-100 px-5 py-4 outline-none"
              />
              {confirmation && (
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="OTP code"
                  className="mt-3 w-full rounded-full bg-zinc-100 px-5 py-4 outline-none"
                />
              )}
              <button onClick={handleOtp} className="pink-gradient mt-3 w-full rounded-full py-4 font-black text-white">
                {confirmation ? "Verify OTP" : "Send OTP"}
              </button>
            </div>
          )}
          <p className="text-center text-base font-medium text-white/90">
            Already have an account? <button onClick={() => setShowOtp(true)} className="font-black text-[#ff3f8d]">Log in</button>
          </p>
          <button onClick={() => enterWithoutLogin()} className="mx-auto block text-sm font-bold text-white/90 underline underline-offset-4">
            Skip for now
          </button>
          {error && <p className="rounded-2xl bg-white/90 p-3 text-sm text-red-500">{error}</p>}
          <div id="recaptcha-container" />
        </div>
      </section>
    </main>
  );
}
