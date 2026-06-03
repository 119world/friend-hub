import { useMemo, useState } from "react";
import { Apple, Flame, Heart, ShieldCheck, UserRound, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { useAuth } from "../hooks/useAuth";
import { defaultWelcome, listenWelcomeConfig } from "../services/appConfig";
import api from "../services/api";

export default function Login() {
  const { user, loginGoogle, loginGuest, enterWithoutLogin, startPhoneLogin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [portal, setPortal] = useState("");
  const [portalForm, setPortalForm] = useState({ id: "", password: "" });
  const [portalNonce, setPortalNonce] = useState(() => Date.now());
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState(defaultWelcome);
  const adminAppUrl = useMemo(() => {
    const envUrl = String(import.meta.env.VITE_ADMIN_APP_URL || "").trim();
    const isLocalHostEnv = /localhost|127\.0\.0\.1/i.test(envUrl);
    const isLocalHostPage = /localhost|127\.0\.0\.1/i.test(window.location.hostname);
    if (envUrl && !(isLocalHostEnv && !isLocalHostPage)) return envUrl;
    return "";
  }, []);

  useEffect(() => {
    return listenWelcomeConfig(setWelcome);
  }, []);

  useEffect(() => {
    if (!portal) return undefined;
    const timer = window.setTimeout(() => {
      setPortalForm({ id: "", password: "" });
      setPortalNonce(Date.now());
    }, 40);
    return () => window.clearTimeout(timer);
  }, [portal]);

  if (user) return <Navigate to="/" replace />;

  function hasRealFirebaseConfig() {
    return Boolean(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID !== "demo" &&
      !String(import.meta.env.VITE_FIREBASE_API_KEY || "").includes("demo")
    );
  }

  async function handleGetStarted() {
    setError("");
    if (!hasRealFirebaseConfig()) {
      enterWithoutLogin();
      return;
    }
    try {
      await loginGuest();
    } catch {
      enterWithoutLogin();
    }
  }

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
    const hasFirebaseConfig = Boolean(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
    const isDemoFirebase =
      !hasFirebaseConfig ||
      import.meta.env.VITE_FIREBASE_PROJECT_ID === "demo" ||
      String(import.meta.env.VITE_FIREBASE_API_KEY || "").includes("demo");
    if (isDemoFirebase) {
      enterWithoutLogin({ name: "Google User", loginProvider: "google_demo" });
      return;
    }
    try {
      await loginGoogle();
    } catch {
      enterWithoutLogin({ name: "Google User", loginProvider: "google_fallback" });
    }
  }

  async function handlePortalLogin() {
    setError("");
    if (!portalForm.id.trim() || !portalForm.password.trim()) {
      setError("ID aur password dono fill karo.");
      return;
    }
    setPortalBusy(true);
    if (portal === "admin") {
      try {
        await api.post("/admin/login", {
          loginId: portalForm.id.trim(),
          password: portalForm.password
        });
        if (adminAppUrl) {
          window.location.href = adminAppUrl;
          return;
        }
        setError("Admin dashboard deploy URL set nahi hai. Vercel me real VITE_ADMIN_APP_URL add karo.");
      } catch (err) {
        setError(err.response?.data?.message || "Admin ID/password galat hai.");
      } finally {
        setPortalBusy(false);
      }
      return;
    }
    if (portal === "partner") {
      try {
        const { data } = await api.post("/partner/login", {
          id: portalForm.id.trim(),
          password: portalForm.password
        });
        localStorage.setItem("friendHubPartnerSession", JSON.stringify({
          token: data.token,
          loginId: data.session?.loginId || portalForm.id.trim(),
          partnerId: data.session?.partnerId,
          accountId: data.session?.accountId,
          role: data.session?.role,
          canManageAll: Boolean(data.session?.canManageAll),
          mainAccountId: data.session?.mainAccountId || data.session?.accountId
        }));
        navigate("/partner");
        return;
      } catch (err) {
        setError(err.response?.data?.message || "Partner login failed.");
      } finally {
        setPortalBusy(false);
      }
    }
    setPortalBusy(false);
  }

  const GoogleMark = () => (
    <span className="relative inline-grid h-8 w-8 place-items-center rounded-full bg-white">
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-8 w-8">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.3 1.2 8.5 3.3l6.3-6.3C35 2.9 29.9 1 24 1 14.7 1 6.8 6.3 3 14.1l7.5 5.8C12.2 13.8 17.5 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.9c-.3 2.1-1.7 5.2-4.8 7.4l7.3 5.7c4.3-4 7.1-9.8 7.1-17.1z" />
        <path fill="#FBBC05" d="M10.5 28.1A14.7 14.7 0 0 1 10.5 20L3 14.1a23.9 23.9 0 0 0 0 19.8l7.5-5.8z" />
        <path fill="#34A853" d="M24 47c5.9 0 10.9-1.9 14.5-5.3l-7.3-5.7c-2 1.4-4.5 2.4-7.2 2.4-6.5 0-11.9-4.3-13.5-10.2L3 33.9C6.8 41.7 14.7 47 24 47z" />
      </svg>
    </span>
  );

  return (
    <main
      className="app-shell relative min-h-screen overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `linear-gradient(180deg, rgba(226,36,119,.90) 0%, rgba(255,95,101,.62) 42%, rgba(0,0,0,.30) 100%), url('${welcome.bgPhoto || welcome.welcomeBgPhoto}')` }}
    >
      <PhoneStatusBar light />
      <Heart className="absolute right-20 top-[335px] z-10 rotate-12 text-white drop-shadow-xl" size={40} fill="currentColor" strokeWidth={0} />
      <Heart className="absolute right-11 top-[386px] z-10 rotate-12 text-white/65 drop-shadow-xl" size={25} fill="currentColor" strokeWidth={0} />

      <section className="relative z-10 flex min-h-screen flex-col px-5 pb-7 pt-10 min-[390px]:px-8 min-[390px]:pb-9 min-[390px]:pt-12">
        <div className="mb-10 min-[390px]:mb-16">
          <div className="relative mb-8 h-12 w-12 min-[390px]:mb-12">
            <Heart className="absolute left-0 top-0 text-white" size={46} fill="currentColor" strokeWidth={0} />
            <Flame className="absolute bottom-0 left-3 text-[#ff3f8d]" size={24} fill="currentColor" strokeWidth={0} />
          </div>
          <h1 className="max-w-[335px] text-[34px] font-black leading-[1.12] tracking-normal min-[390px]:text-[42px]">{welcome.title}</h1>
          <p className="mt-4 max-w-[285px] text-[18px] font-medium leading-[1.35] text-white/92 min-[390px]:mt-6 min-[390px]:text-[22px]">{welcome.subtitle}</p>
        </div>

        <div className="mt-auto space-y-4">
          <button onClick={handleGetStarted} className="pink-gradient h-16 w-full rounded-full text-lg font-black text-white shadow-2xl shadow-pink-700/25">
            Get Started
          </button>
          <button onClick={handleGoogle} className="flex h-16 w-full items-center justify-center gap-5 rounded-full bg-white text-lg font-bold text-zinc-900 shadow-xl">
            <GoogleMark /> Continue with Google
          </button>
          <button onClick={() => setError("Apple login is ready as a placeholder. Add Apple provider keys before enabling production sign-in.")} className="flex h-16 w-full items-center justify-center gap-5 rounded-full bg-white text-lg font-bold text-zinc-900 shadow-xl">
            <Apple size={30} fill="currentColor" /> Continue with Apple
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setPortal("admin"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/18 text-sm font-black text-white backdrop-blur">
              <ShieldCheck size={18} /> Admin
            </button>
            <button onClick={() => { setPortal("partner"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/18 text-sm font-black text-white backdrop-blur">
              <UserRound size={18} /> Partner
            </button>
          </div>
          {portal && (
            <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]">
              <form
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!portalBusy) handlePortalLogin();
                }}
                className="absolute inset-x-3 bottom-3 max-h-[72dvh] overflow-y-auto rounded-[26px] bg-white p-4 text-zinc-900 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-black">{portal === "admin" ? "Admin Login" : "Partner Login"}</p>
                  <button onClick={() => { setPortal(""); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="rounded-full bg-zinc-100 p-2"><X size={16} /></button>
                </div>
                <input className="hidden" type="text" name={`fh_${portalNonce}_hidden_user`} autoComplete="username" readOnly />
                <input className="hidden" type="password" name={`fh_${portalNonce}_hidden_pass`} autoComplete="current-password" readOnly />
                <input
                  key={`id_${portal}_${portalNonce}`}
                  value={portalForm.id}
                  onChange={(e) => setPortalForm({ ...portalForm, id: e.target.value })}
                  placeholder="ID"
                  name={`fh_${portal}_${portalNonce}_id`}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-form-type="other"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-full bg-zinc-100 px-5 py-3 outline-none"
                />
                <input
                  key={`pass_${portal}_${portalNonce}`}
                  value={portalForm.password}
                  onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })}
                  type="password"
                  placeholder="Password"
                  name={`fh_${portal}_${portalNonce}_password`}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-form-type="other"
                  className="mt-3 w-full rounded-full bg-zinc-100 px-5 py-3 outline-none"
                />
                <button type="submit" disabled={portalBusy} className="pink-gradient mt-3 h-11 w-full rounded-full font-black text-white disabled:opacity-60">
                  {portalBusy ? "Please wait..." : "Login"}
                </button>
              </form>
            </div>
          )}
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
          <p className="text-center text-xs font-medium text-white/85">
            Friend Hub is a social networking and friendship platform. It is not an adult, escort, or matrimonial service.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-white">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/refund">Refund</Link>
            <Link to="/safety">Safety</Link>
            <Link to="/abuse">Report Abuse</Link>
          </div>
          {error && <p className="rounded-2xl bg-white/90 p-3 text-sm text-red-500">{error}</p>}
          <div id="recaptcha-container" />
        </div>
      </section>
    </main>
  );
}
