import api from "./api";

const POLL_MS = 5000;

export const defaultPlans = [
  { id: "first_9", title: "First-time Offer", originalPrice: 19, price: 9, diamonds: 30, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 9 },
  { id: "normal_19", title: "Starter", originalPrice: 49, price: 19, diamonds: 50, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 19 },
  { id: "offer_49", title: "Friend Offer", originalPrice: 199, price: 49, diamonds: 160, minutes: 4, active: true, subscription: false, autoPay: true, autoPayAmount: 49 },
  { id: "premium_99", title: "Premium Offer", originalPrice: 399, price: 99, diamonds: 360, minutes: 10, active: true, subscription: true, autoPay: true, autoPayAmount: 99 }
];

export const defaultReplyConfig = {
  welcomeMessage: "Hey! How's your weekend going?",
  firstReply: "That sounds amazing! I love hiking too.",
  secondReply: "Definitely! I'd love that.",
  limitReachedMessage: "You have used the free chat preview.",
  rechargeMessage: "Recharge to continue this conversation.",
  replyLimit: 2,
  delayMs: 650
};

export const defaultWelcome = {
  title: "Meet New Friends. Build Real Connections.",
  subtitle: "Friend Hub is a social networking platform where users can discover people, chat safely, and build interest-based friendships.",
  bgPhoto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
  maintenanceMode: false,
  maintenanceTitle: "Friend Hub is updating",
  maintenanceMessage: "We are polishing the app. Please check again in a few minutes.",
  maintenanceActionLabel: "",
  maintenanceActionUrl: ""
};

const useFirestore = import.meta.env.VITE_USE_FIRESTORE === "true";

async function loadFirestore() {
  const firestore = await import("firebase/firestore");
  const firebase = await import("../firebase/firebase");
  return { ...firestore, db: firebase.db };
}

async function apiFallback(path, fallback) {
  try {
    const separator = path.includes("?") ? "&" : "?";
    const { data } = await api.get(`${path}${separator}_=${Date.now()}`);
    return data.item || data.items || fallback;
  } catch {
    return fallback;
  }
}

function startPolling(load) {
  load();
  const timer = window.setInterval(load, POLL_MS);
  const refreshOnVisible = () => {
    if (!document.hidden) load();
  };
  window.addEventListener("focus", load);
  window.addEventListener("pageshow", load);
  document.addEventListener("visibilitychange", refreshOnVisible);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", load);
    window.removeEventListener("pageshow", load);
    document.removeEventListener("visibilitychange", refreshOnVisible);
  };
}

function normalizeProfile(id, type, data) {
  const photos = Array.isArray(data.photos) ? data.photos.filter(Boolean).slice(0, 7) : [];
  const galleryPhotos = Array.isArray(data.galleryPhotos) ? data.galleryPhotos.filter(Boolean).slice(0, 7) : [];
  return {
    id,
    type,
    ...data,
    photos: (photos.length ? photos : galleryPhotos).slice(0, 7),
    galleryPhotos: (galleryPhotos.length ? galleryPhotos : photos).slice(0, 7),
    videos: Array.isArray(data.videos) ? data.videos.filter(Boolean).slice(0, 3) : [],
    interests: Array.isArray(data.interests) ? data.interests : String(data.interests || "").split(",").map((item) => item.trim()).filter(Boolean),
    active: data.active !== false,
    showInDiscovery: data.showInDiscovery !== false,
    showInMatches: data.showInMatches !== false,
    allowAutoContact: data.allowAutoContact !== false
  };
}

export function listenWelcomeConfig(cb) {
  if (!useFirestore) {
    let live = true;
    const load = () => apiFallback("/public/welcome", defaultWelcome).then((item) => live && cb({ ...defaultWelcome, ...item }));
    const stopPolling = startPolling(load);
    return () => {
      live = false;
      stopPolling();
    };
  }
  let unsub = () => {};
  let closed = false;
  loadFirestore().then(({ doc, onSnapshot, db }) => {
    if (closed) return;
    unsub = onSnapshot(doc(db, "appSettings", "welcome"), (snap) => {
      cb({ ...defaultWelcome, ...(snap.exists() ? snap.data() : {}) });
    }, () => apiFallback("/public/welcome", defaultWelcome).then((item) => cb({ ...defaultWelcome, ...item })));
  }).catch(() => apiFallback("/public/welcome", defaultWelcome).then((item) => cb({ ...defaultWelcome, ...item })));
  return () => {
    closed = true;
    unsub();
  };
}

export function listenPlans(cb) {
  if (!useFirestore) {
    let live = true;
    const load = () => apiFallback("/public/plans", defaultPlans).then((items) => live && cb(items.length ? items : defaultPlans));
    const stopPolling = startPolling(load);
    return () => {
      live = false;
      stopPolling();
    };
  }
  let unsub = () => {};
  let closed = false;
  loadFirestore().then(({ collection, onSnapshot, query, where, db }) => {
    if (closed) return;
    const q = query(collection(db, "plans"), where("active", "==", true));
    unsub = onSnapshot(q, (snap) => {
      const plans = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      cb(plans.length ? plans : defaultPlans);
    }, () => apiFallback("/public/plans", defaultPlans).then((items) => cb(items.length ? items : defaultPlans)));
  }).catch(() => apiFallback("/public/plans", defaultPlans).then((items) => cb(items.length ? items : defaultPlans)));
  return () => {
    closed = true;
    unsub();
  };
}

export function listenReplyConfig(cb) {
  if (!useFirestore) {
    let live = true;
    const load = () => apiFallback("/public/reply-config", defaultReplyConfig).then((item) => live && cb({ ...defaultReplyConfig, ...item }));
    const stopPolling = startPolling(load);
    return () => {
      live = false;
      stopPolling();
    };
  }
  let unsub = () => {};
  let closed = false;
  loadFirestore().then(({ doc, onSnapshot, db }) => {
    if (closed) return;
    unsub = onSnapshot(doc(db, "replyTemplates", "default"), (snap) => {
      cb({ ...defaultReplyConfig, ...(snap.exists() ? snap.data() : {}) });
    }, () => apiFallback("/public/reply-config", defaultReplyConfig).then((item) => cb({ ...defaultReplyConfig, ...item })));
  }).catch(() => apiFallback("/public/reply-config", defaultReplyConfig).then((item) => cb({ ...defaultReplyConfig, ...item })));
  return () => {
    closed = true;
    unsub();
  };
}

export function listenPublicProfiles(cb) {
  if (!useFirestore) {
    let live = true;
    const load = () => apiFallback("/public/profiles", []).then((items) => live && cb(items.map((item) => normalizeProfile(item.id, item.type, item))));
    const stopPolling = startPolling(load);
    return () => {
      live = false;
      stopPolling();
    };
  }
  const values = { partners: [], bots: [] };
  const emit = () => cb([...values.partners, ...values.bots].filter((item) => item.active !== false));
  let unsubPartners = () => {};
  let unsubBots = () => {};
  let closed = false;
  loadFirestore().then(({ collection, onSnapshot, query, where, db }) => {
    if (closed) return;
    const partnerQ = query(collection(db, "partners"), where("active", "==", true));
    const botQ = query(collection(db, "aiBots"), where("active", "==", true));
    unsubPartners = onSnapshot(partnerQ, (snap) => {
      values.partners = snap.docs.map((item) => normalizeProfile(item.id, "partner", item.data()));
      emit();
    }, () => {
      apiFallback("/public/profiles", []).then((items) => {
        values.partners = items.filter((item) => item.type === "partner").map((item) => normalizeProfile(item.id, "partner", item));
        emit();
      });
    });
    unsubBots = onSnapshot(botQ, (snap) => {
      values.bots = snap.docs.map((item) => normalizeProfile(item.id, "bot", item.data()));
      emit();
    }, () => {
      apiFallback("/public/profiles", []).then((items) => {
        values.bots = items.filter((item) => item.type === "bot").map((item) => normalizeProfile(item.id, "bot", item));
        emit();
      });
    });
  }).catch(() => apiFallback("/public/profiles", []).then((items) => cb(items.map((item) => normalizeProfile(item.id, item.type, item)))));
  return () => {
    closed = true;
    unsubPartners();
    unsubBots();
  };
}
