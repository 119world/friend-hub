import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowRight, Check, ChevronDown, Globe2, LockKeyhole, ShieldCheck, UsersRound, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const LOGIN_BG = "/assets/friend-hub-login-bg.png";

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
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
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
    if (starting) return;
    setStarting(true);
    setError("");
    if (!hasRealFirebaseConfig()) {
      enterWithoutLogin();
      return;
    }
    try {
      await loginGuest();
    } catch {
      enterWithoutLogin();
    } finally {
      window.setTimeout(() => setStarting(false), 450);
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
      <div
        className={`landing-bg ${entrance ? "landing-bg--visible" : ""}`}
        style={{ backgroundImage: `url('${LOGIN_BG}')` }}
        aria-hidden="true"
      />
      <div className={`landing-overlay ${entrance ? "landing-overlay--visible" : ""}`} aria-hidden="true" />
      <div ref={heartsRef} className="landing-hearts" aria-hidden="true" />

      <div className={`landing-content ${entrance ? "landing-content--active" : ""}`}>
        <header className="landing-topbar">
          <div className="landing-logo" aria-label="Friend Hub">
            <span />
          </div>
          <button className="landing-language" type="button" aria-label="Select language">
            <Globe2 size={20} strokeWidth={2.5} />
            <span>English</span>
            <ChevronDown size={20} strokeWidth={2.5} />
          </button>
        </header>

        <section className="landing-hero" aria-label="Friend Hub login">
          <div className="landing-hero__spark" aria-hidden="true" />
          <h1 className="landing-hero__title">Meet New Friends. Build Real Connections.</h1>
          <p className="landing-hero__subtitle">
            Friend Hub is a trusted platform to help you make meaningful friendships, find love and build genuine relationships.
          </p>
        </section>

        <section className="landing-actions" aria-label="Continue to Friend Hub">
          <div className="landing-feature-card">
            <div className="landing-feature-card__item">
              <ShieldCheck size={30} />
              <span>Verified<br />Profiles</span>
            </div>
            <div className="landing-feature-card__divider" />
            <div className="landing-feature-card__item">
              <LockKeyhole size={30} />
              <span>Privacy<br />Protected</span>
            </div>
            <div className="landing-feature-card__divider" />
            <div className="landing-feature-card__item">
              <UsersRound size={32} />
              <span>Millions of<br />Happy Users</span>
            </div>
          </div>

          <button onClick={handleGetStarted} className={`landing-btn ${starting ? "is-loading" : ""}`} disabled={starting}>
            <span className="landing-btn__text">{starting ? "Please wait" : "Get Started"}</span>
            {starting && <span className="landing-loading-dot" aria-hidden="true" />}
            <ArrowRight size={31} strokeWidth={2.3} />
          </button>

          <div className="landing-divider">
            <span />
            <p>or continue with</p>
            <span />
          </div>

          <div className="landing-socials">
            <button type="button" onClick={handleGetStarted} className={`landing-social-btn ${starting ? "is-loading" : ""}`} disabled={starting}>
              <span className="landing-social-icon landing-social-icon--google">G</span>
              <span>{starting ? "Please wait" : "Continue with Google"}</span>
              {starting && <span className="landing-loading-dot landing-loading-dot--dark" aria-hidden="true" />}
            </button>
            <button type="button" onClick={handleGetStarted} className={`landing-social-btn ${starting ? "is-loading" : ""}`} disabled={starting}>
              <span className="landing-social-icon landing-social-icon--facebook">f</span>
              <span>{starting ? "Please wait" : "Continue with Facebook"}</span>
              {starting && <span className="landing-loading-dot landing-loading-dot--dark" aria-hidden="true" />}
            </button>
            <button type="button" onClick={handleGetStarted} className={`landing-social-btn ${starting ? "is-loading" : ""}`} disabled={starting}>
              <span className="landing-social-icon landing-social-icon--apple">●</span>
              <span>{starting ? "Please wait" : "Continue with Apple"}</span>
              {starting && <span className="landing-loading-dot landing-loading-dot--dark" aria-hidden="true" />}
            </button>
          </div>

          <p className="landing-signup">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={handleGetStarted}>Sign Up</button>
          </p>

          <p className="landing-privacy">
            <Check size={21} />
            <span>
              By continuing you agree to our{" "}
              <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>
            </span>
          </p>
        </section>

        <div className="landing-admin-links" aria-label="Staff links">
          <button onClick={() => { setPortal("partner"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="landing-footer__link">Partner</button>
          <span aria-hidden="true">|</span>
          <button onClick={() => { setPortal("admin"); setPortalForm({ id: "", password: "" }); setPortalNonce(Date.now()); }} className="landing-footer__link">Admin</button>
        </div>
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
