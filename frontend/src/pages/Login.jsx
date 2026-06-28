import { useMemo, useState, useEffect, useRef } from "react";
import { Heart, Flame, ShieldCheck, UserRound, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { defaultWelcome, listenWelcomeConfig } from "../services/appConfig";
import api from "../services/api";

/* ─── Floating Hearts Animation Hook ─── */
function useFloatingHearts(containerRef, enabled) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let animationId;
    const hearts = [];
    const MAX_HEARTS = 18;

    function createHeart() {
      if (hearts.length >= MAX_HEARTS) return;
      const el = document.createElement("span");
      el.className = "fh-heart";
      el.textContent = "♥";

      const size = 12 + Math.random() * 28;
      const left = Math.random() * 100;
      const duration = 6 + Math.random() * 8;
      const delay = Math.random() * 2;
      const swayAmount = 20 + Math.random() * 40;
      const opacity = 0.12 + Math.random() * 0.28;

      el.style.cssText = `
        position:absolute;
        bottom:-40px;
        left:${left}%;
        font-size:${size}px;
        color:rgba(255,255,255,${opacity});
        pointer-events:none;
        will-change:transform,opacity;
        animation:floatHeart ${duration}s ${delay}s ease-out forwards;
        --sway:${swayAmount}px;
        z-index:1;
      `;

      container.appendChild(el);
      hearts.push(el);

      el.addEventListener("animationend", () => {
        el.remove();
        const idx = hearts.indexOf(el);
        if (idx > -1) hearts.splice(idx, 1);
      });
    }

    let spawnInterval = setInterval(() => {
      if (hearts.length < MAX_HEARTS) createHeart();
    }, 800);

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationId);
      hearts.forEach((h) => h.remove());
      hearts.length = 0;
    };
  }, [enabled]);
}

/* ─── Entrance Animation Hook ─── */
function useEntrance() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStarted(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return started;
}

/* ─── Login Page Component ─── */
export default function Login() {
  const { user, loginGuest, enterWithoutLogin, startPhoneLogin } = useAuth();
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
  const heartsRef = useRef(null);
  const entrance = useEntrance();

  const adminAppUrl = useMemo(() => {
    const envUrl = String(import.meta.env.VITE_ADMIN_APP_URL || "").trim();
    const isLocalHostEnv = /localhost|127\.0\.0\.1/i.test(envUrl);
    const isLocalHostPage = /localhost|127\.0\.0\.1/i.test(window.location.hostname);
    if (envUrl && !(isLocalHostEnv && !isLocalHostPage)) return envUrl;
    return "";
  }, []);

  useFloatingHearts(heartsRef, entrance);

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

  return (
    <main className="landing-shell">
      {/* ── Background Layer ── */}
      <div
        className={`landing-bg ${entrance ? "landing-bg--visible" : ""}`}
        style={{ backgroundImage: `url('${welcome.bgPhoto || welcome.welcomeBgPhoto}')` }}
        aria-hidden="true"
      />
      <div className={`landing-overlay ${entrance ? "landing-overlay--visible" : ""}`} aria-hidden="true" />

      {/* ── Floating Hearts Container ── */}
      <div ref={heartsRef} className="landing-hearts" aria-hidden="true" />

      {/* ── Content ── */}
      <div className={`landing-content ${entrance ? "landing-content--active" : ""}`}>
        {/* ── Hero Section ── */}
        <section className="landing-hero">
          <div className="landing-hero__glass">
            {/* Floating heart icon */}
            <div className="landing-hero__icon">
              <div className="landing-hero__icon-pulse">
                <Heart size={42} fill="currentColor" strokeWidth={0} />
              </div>
              <Flame
                className="landing-hero__flame"
                size={20}
                fill="currentColor"
                strokeWidth={0}
              />
            </div>

            <h1 className="landing-hero__title">{welcome.title}</h1>
            <p className="landing-hero__subtitle">{welcome.subtitle}</p>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="landing-cta">
          <button onClick={handleGetStarted} className="landing-btn">
            <span className="landing-btn__text">Get Started</span>
          </button>

          {/* Already have account */}
          <p className="landing-login-link">
            Already have an account?{" "}
            <button onClick={() => setShowOtp(true)} className="landing-login-link__action">
              Log in
            </button>
          </p>
        </section>

        {/* ── Disclaimer ── */}
        <p className="landing-disclaimer">
          Friend Hub is a social networking and friendship platform. It is not an adult, escort, or matrimonial service.
        </p>

        {/* ── Footer Links ── */}
        <footer className="landing-footer">
          <Link to="/about">About</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/contact">Contact</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/privacy">Privacy</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/terms">Terms</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/refund">Refund</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/safety">Safety</Link>
          <span className="landing-footer__dot">•</span>
          <Link to="/abuse">Report Abuse</Link>
          <span className="landing-footer__dot">•</span>
          <button onClick={() => { setPortal("admin"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="landing-footer__link">Admin</button>
          <span className="landing-footer__dot">•</span>
          <button onClick={() => { setPortal("partner"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="landing-footer__link">Partner</button>
        </footer>
      </div>

      {/* ── Error Toast ── */}
      {error && (
        <div className="landing-error">
          <p>{error}</p>
          <button onClick={() => setError("")} className="landing-error__close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Portal Login Modal ── */}
      {portal && (
        <div className="landing-modal-backdrop">
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              if (!portalBusy) handlePortalLogin();
            }}
            className="landing-modal"
          >
            <div className="landing-modal__header">
              <p className="landing-modal__title">
                {portal === "admin" ? "Admin Login" : "Partner Login"}
              </p>
              <button
                onClick={() => { setPortal(""); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }}
                className="landing-modal__close"
              >
                <X size={16} />
              </button>
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
              className="landing-modal__input"
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
              className="landing-modal__input"
            />
            <button type="submit" disabled={portalBusy} className="landing-modal__submit">
              {portalBusy ? "Please wait..." : "Login"}
            </button>
          </form>
        </div>
      )}

      {/* ── OTP Login Modal ── */}
      {showOtp && (
        <div className="landing-modal-backdrop">
          <div className="landing-modal">
            <div className="landing-modal__header">
              <p className="landing-modal__title">Log in</p>
              <button onClick={() => setShowOtp(false)} className="landing-modal__close">
                <X size={16} />
              </button>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 mobile number"
              className="landing-modal__input"
            />
            {confirmation && (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="OTP code"
                className="landing-modal__input"
              />
            )}
            <button onClick={handleOtp} className="landing-modal__submit">
              {confirmation ? "Verify OTP" : "Send OTP"}
            </button>
          </div>
        </div>
      )}

      <div id="recaptcha-container" />
    </main>
  );
}
