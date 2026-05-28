import { createContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

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

async function loadBackendProfile() {
  const { data } = await api.get("/users/me");
  return data?.profile || null;
}

async function saveBackendProfile(payload) {
  const { data } = await api.patch("/users/me", payload);
  return data?.profile || null;
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

const starterProfiles = [
  {
    name: "Aarav",
    age: 27,
    gender: "Man",
    city: "Mumbai, India",
    bio: "Traveller, startup builder, and coffee explorer.",
    interests: ["Travel", "Fitness", "Startups", "Music"]
  },
  {
    name: "Meera",
    age: 25,
    gender: "Woman",
    city: "Bangalore, India",
    bio: "Love to travel, explore new cafes, and capture moments.",
    interests: ["Travel", "Photography", "Coffee", "Music", "Hiking"]
  },
  {
    name: "Ishita",
    age: 24,
    gender: "Woman",
    city: "Pune, India",
    bio: "Calm vibes, books, and meaningful conversations.",
    interests: ["Books", "Movies", "Cooking", "Music"]
  },
  {
    name: "Kabir",
    age: 28,
    gender: "Man",
    city: "Delhi, India",
    bio: "Gym, weekend rides, and honest chats.",
    interests: ["Gym", "Biking", "Cricket", "Podcasts"]
  }
];

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
        if (parsed?.isLocal && String(parsed.uid || "").startsWith("local_")) {
          setUser({ uid: parsed.uid, isLocal: true });
          setProfile(parsed);
          setLoading(false);
          return undefined;
        }
        localStorage.removeItem("friendHubLocalProfile");
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
          try {
            const saved = await loadBackendProfile();
            setProfile(saved || defaultProfile(current));
          } catch {
            setProfile(defaultProfile(current));
          }
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
        if (user?.isLocal) {
          const parsed = JSON.parse(localStorage.getItem("friendHubLocalProfile") || "{}");
          setProfile(Object.keys(parsed).length ? parsed : profile);
          return;
        }
        if (!useFirestore) {
          try {
            const saved = await loadBackendProfile();
            if (saved) setProfile(saved);
          } catch {}
          return;
        }
        try {
          const [{ auth }, { db, doc, getDoc }] = await Promise.all([loadFirebaseAuth(), loadFirestoreTools()]);
          if (!auth.currentUser) return;
          const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
          setProfile({ id: snap.id, ...snap.data() });
        } catch {}
      },
      updateProfile: async (payload = {}) => {
        if (!user) return null;
        if (user.isLocal) {
          const next = { ...(profile || {}), ...payload, uid: user.uid, isLocal: true, updatedAt: new Date().toISOString() };
          localStorage.setItem("friendHubLocalProfile", JSON.stringify(next));
          setProfile(next);
          return next;
        }
        if (!useFirestore) {
          const saved = await saveBackendProfile(payload);
          if (saved) setProfile(saved);
          return saved;
        }
        const { auth } = await loadFirebaseAuth();
        const { db, doc, serverTimestamp, setDoc, getDoc } = await loadFirestoreTools();
        const uid = auth.currentUser?.uid || user.uid;
        await setDoc(doc(db, "users", uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
        const fresh = await getDoc(doc(db, "users", uid));
        const next = { id: fresh.id, ...fresh.data() };
        setProfile(next);
        return next;
      },
      applyWalletCredit: async (plan = {}) => {
        if (!user) return;
        const next = {
          ...(profile || {}),
          uid: user.uid,
          diamonds: Number(profile?.diamonds || 0) + Number(plan.diamonds || 0),
          minutes: Number(profile?.minutes || 0) + Number(plan.minutes || 0)
        };
        if (user.isLocal) {
          localStorage.setItem("friendHubLocalProfile", JSON.stringify({ ...next, isLocal: true }));
        }
        setProfile(next);
        if (!user.isLocal && !useFirestore) {
          try {
            const saved = await loadBackendProfile();
            if (saved) setProfile(saved);
          } catch {}
        }
      },
      loginGoogle: async () => {
        const { auth, googleProvider, signInWithPopup } = await loadFirebaseAuth();
        return signInWithPopup(auth, googleProvider);
      },
      enterWithoutLogin: (overrides = {}) => {
        const seed = starterProfiles[Math.floor(Math.random() * starterProfiles.length)];
        const local = {
          uid: `local_${Date.now()}`,
          name: seed.name,
          age: seed.age,
          gender: seed.gender,
          city: seed.city,
          lat: 12.9716,
          lng: 77.5946,
          religion: "",
          bio: seed.bio,
          interests: seed.interests,
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
          } else if (auth.currentUser) {
            await api.patch("/users/me", { online: false }).catch(() => {});
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
