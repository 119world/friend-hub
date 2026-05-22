import { createContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, RecaptchaVerifier } from "../firebase/firebase";

export const AuthContext = createContext(null);

const defaultProfile = (user) => ({
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
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (!current) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "users", current.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, defaultProfile(current), { merge: true });
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
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile: async () => {
        if (user?.isLocal) {
          const parsed = JSON.parse(localStorage.getItem("friendHubLocalProfile") || "{}");
          setProfile(parsed);
          return;
        }
        if (!auth.currentUser) return;
        try {
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
        if (user.isLocal || import.meta.env.VITE_USE_FIRESTORE === "false") {
          localStorage.setItem("friendHubLocalProfile", JSON.stringify({ ...next, isLocal: user.isLocal || import.meta.env.VITE_USE_FIRESTORE === "false" }));
        }
        setProfile(next);
      },
      loginGoogle: () => signInWithPopup(auth, googleProvider),
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
      loginGuest: () => signInAnonymously(auth),
      startPhoneLogin: async (phone) => {
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
        if (auth.currentUser) {
          await setDoc(doc(db, "users", auth.currentUser.uid), { online: false }, { merge: true }).catch(() => {});
        }
        return signOut(auth);
      },
      GoogleAuthProvider
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
