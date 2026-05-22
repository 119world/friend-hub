import { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const useFirestore = import.meta.env.VITE_USE_FIRESTORE === "true";

function hasFirebaseConfig() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== "demo"
  );
}

async function loadFirebaseAuth() {
  const firebase = await import("../firebase/firebase");
  const authSdk = await import("firebase/auth");
  return { ...firebase, ...authSdk };
}

async function loadFirestoreTools() {
  const firebase = await import("../firebase/firebase");
  const firestore = await import("firebase/firestore");
  return { db: firebase.db, ...firestore };
}

const defaultProfile = (user, timestamp = new Date().toISOString()) => ({
  uid: user.uid,
  name: user.displayName || "Friend Hub User",
  age: 21,
  gender: "Female",
  city: "Delhi",
  lat: 28.6139,
  lng: 77.209,
  religion: "",
  bio: "Here to meet kind people.",
  interests: ["Friendship", "Music"],
  photos: user.photoURL ? [user.photoURL] : [],
  videos: [],
  role: "user",
  diamonds: 0,
  referralCode: user.uid.slice(0, 8).toUpperCase(),
  referralCount: 0,
  online: true,
  createdAt: timestamp,
  updatedAt: timestamp
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    let live = true;

    const localProfile = localStorage.getItem("friendHubLocalProfile");
    if (localProfile) {
      try {
        const parsed = JSON.parse(localProfile);
        setUser({ uid: parsed.uid, isLocal: true });
        setProfile(parsed);
        setLoading(false);
        return undefined;
      } catch {
        localStorage.removeItem("friendHubLocalProfile");
      }
    }

    if (!hasFirebaseConfig()) {
      setLoading(false);
      return undefined;
    }

    loadFirebaseAuth().then(({ auth, onAuthStateChanged }) => {
      if (!live) return;
      unsub = onAuthStateChanged(auth, async (current) => {
        if (!live) return;
        setUser(current);
        if (!current) {
          setProfile(null);
          setLoading(false);
          return;
        }

        if (!useFirestore) {
          setProfile(defaultProfile(current));
          setLoading(false);
          return;
        }

        try {
          const { db, doc, getDoc, serverTimestamp, setDoc } = await loadFirestoreTools();
          const ref = doc(db, "users", current.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, defaultProfile(current, serverTimestamp()), { merge: true });
          } else {
            await setDoc(ref, { online: true, updatedAt: serverTimestamp() }, { merge: true });
          }
          const fresh = await getDoc(ref);
          setProfile({ id: fresh.id, ...fresh.data() });
        } catch {
          setProfile(defaultProfile(current));
        }
        setLoading(false);
      });
    }).catch(() => {
      if (live) setLoading(false);
    });

    return () => {
      live = false;
      unsub();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile: async () => {
        if (user?.isLocal || !useFirestore) {
          const parsed = JSON.parse(localStorage.getItem("friendHubLocalProfile") || "{}");
          setProfile(Object.keys(parsed).length ? parsed : profile);
          return;
        }
        try {
          const [{ auth }, { db, doc, getDoc }] = await Promise.all([loadFirebaseAuth(), loadFirestoreTools()]);
          if (!auth.currentUser) return;
          const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
          setProfile({ id: snap.id, ...snap.data() });
        } catch {}
      },
      applyWalletCredit: (plan = {}) => {
        if (!user) return;
        const next = {
          ...(profile || {}),
          uid: user.uid,
          diamonds: Number(profile?.diamonds || 0) + Number(plan.diamonds || 0),
          minutes: Number(profile?.minutes || 0) + Number(plan.minutes || 0)
        };
        if (user.isLocal || !useFirestore) {
          localStorage.setItem("friendHubLocalProfile", JSON.stringify({ ...next, isLocal: true }));
        }
        setProfile(next);
      },
      loginGoogle: async () => {
        const { auth, googleProvider, signInWithPopup } = await loadFirebaseAuth();
        return signInWithPopup(auth, googleProvider);
      },
      enterWithoutLogin: (overrides = {}) => {
        const local = {
          uid: `local_${Date.now()}`,
          name: "Meera",
          age: 25,
          gender: "Woman",
          city: "Bangalore, India",
          lat: 12.9716,
          lng: 77.5946,
          religion: "",
          bio: "Love to travel, explore new cafes, and capture moments. Looking for someone who is kind, honest and fun to be with.",
          interests: ["Travel", "Photography", "Coffee", "Music", "Hiking", "Movies"],
          photos: ["https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=85"],
          videos: [],
          role: "user",
          diamonds: 0,
          referralCode: `FH${Date.now().toString().slice(-6)}`,
          referralCount: 0,
          online: true,
          isLocal: true,
          ...overrides
        };
        localStorage.setItem("friendHubLocalProfile", JSON.stringify(local));
        setUser({ uid: local.uid, isLocal: true });
        setProfile(local);
      },
      loginGuest: async () => {
        const { auth, signInAnonymously } = await loadFirebaseAuth();
        return signInAnonymously(auth);
      },
      startPhoneLogin: async (phone) => {
        const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await loadFirebaseAuth();
        window.recaptchaVerifier ||= new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        return signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      },
      logout: async () => {
        localStorage.removeItem("friendHubLocalProfile");
        localStorage.removeItem("friendHubLocalChats");
        if (user?.isLocal) {
          setUser(null);
          setProfile(null);
          return;
        }
        try {
          const { auth, signOut } = await loadFirebaseAuth();
          if (useFirestore && auth.currentUser) {
            const { db, doc, setDoc } = await loadFirestoreTools();
            await setDoc(doc(db, "users", auth.currentUser.uid), { online: false }, { merge: true }).catch(() => {});
          }
          return signOut(auth);
        } catch {
          setUser(null);
          setProfile(null);
        }
      }
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
