import api from "./api";

const POLL_MS = 5000;
const PROFILE_CACHE_KEY = "friendHubPublicProfiles:v2";
const PROFILE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PROFILE_REFRESH_MS = 8 * 60 * 1000;
const PROFILE_RETRY_DELAYS_MS = [0, 1200, 2400, 4800, 9000, 15000, 30000];

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

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isPublicPartnerProfile(item) {
  return item?.active !== false && (item?.type || "partner") === "partner";
}

function readProfileCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || "null");
    if (!cached || !Array.isArray(cached.profiles)) return { profiles: [], updatedAt: 0 };
    if (Date.now() - Number(cached.updatedAt || 0) > PROFILE_CACHE_MAX_AGE_MS) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return { profiles: [], updatedAt: 0 };
    }
    return {
      profiles: cached.profiles.map((item) => normalizeProfile(item.id, item.type || "partner", item)).filter(isPublicPartnerProfile),
      updatedAt: Number(cached.updatedAt || 0)
    };
  } catch {
    return { profiles: [], updatedAt: 0 };
  }
}

function writeProfileCache(profiles) {
  try {
    const payload = { updatedAt: Date.now(), profiles };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

function preloadProfileImages(profiles) {
  const urls = profiles.flatMap((item) => [
    ...(Array.isArray(item.photos) ? item.photos : []),
    ...(Array.isArray(item.galleryPhotos) ? item.galleryPhotos : [])
  ]).filter(Boolean).slice(0, 80);

  urls.forEach((url) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
  });
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

const cachedProfiles = readProfileCache();
const profileSubscribers = new Set();
let profileResourceStarted = false;
let profileRefreshTimer = null;
let profileFetchInFlight = null;

let profileState = {
  profiles: cachedProfiles.profiles,
  status: cachedProfiles.profiles.length ? "ready" : "loading",
  error: "",
  source: cachedProfiles.profiles.length ? "cache" : "network",
  updatedAt: cachedProfiles.updatedAt,
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  isRefreshing: false
};

function emitProfileState(patch = {}) {
  profileState = { ...profileState, ...patch };
  profileSubscribers.forEach((cb) => cb(profileState));
}

function publishProfiles(items, source) {
  const profiles = (Array.isArray(items) ? items : [])
    .map((item) => normalizeProfile(item.id, item.type || "partner", item))
    .filter(isPublicPartnerProfile);
  const updatedAt = Date.now();
  writeProfileCache(profiles);
  preloadProfileImages(profiles);
  emitProfileState({
    profiles,
    status: "ready",
    error: "",
    source,
    updatedAt,
    isRefreshing: false,
    isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false
  });
  return profiles;
}

async function fetchPublicProfilesWithRetry() {
  if (profileFetchInFlight) return profileFetchInFlight;

  profileFetchInFlight = (async () => {
    let lastError = null;
    emitProfileState({ isRefreshing: true });

    for (const delay of PROFILE_RETRY_DELAYS_MS) {
      if (delay) await wait(delay);
      try {
        const separator = "/public/profiles".includes("?") ? "&" : "?";
        const { data } = await api.get(`/public/profiles${separator}_=${Date.now()}`, { timeout: 22000 });
        return publishProfiles(data.items || [], "api");
      } catch (err) {
        lastError = err;
        if (typeof navigator !== "undefined" && !navigator.onLine) break;
      }
    }

    emitProfileState({
      status: profileState.profiles.length ? "ready" : "error",
      error: lastError?.response?.data?.message || lastError?.message || "Profiles are temporarily unavailable.",
      isRefreshing: false,
      isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false
    });
    return profileState.profiles;
  })().finally(() => {
    profileFetchInFlight = null;
  });

  return profileFetchInFlight;
}

function refreshProfilesIfStale() {
  const stale = Date.now() - Number(profileState.updatedAt || 0) > PROFILE_REFRESH_MS;
  if (stale || !profileState.profiles.length) fetchPublicProfilesWithRetry();
}

function startProfileApiRefresh() {
  fetchPublicProfilesWithRetry();
  profileRefreshTimer = window.setInterval(refreshProfilesIfStale, PROFILE_REFRESH_MS);

  const refreshOnVisible = () => {
    if (!document.hidden) refreshProfilesIfStale();
  };
  const setOnline = () => {
    emitProfileState({ isOffline: false });
    fetchPublicProfilesWithRetry();
  };
  const setOffline = () => emitProfileState({ isOffline: true });

  window.addEventListener("focus", refreshProfilesIfStale);
  window.addEventListener("pageshow", refreshProfilesIfStale);
  window.addEventListener("online", setOnline);
  window.addEventListener("offline", setOffline);
  document.addEventListener("visibilitychange", refreshOnVisible);

  return () => {
    window.clearInterval(profileRefreshTimer);
    window.removeEventListener("focus", refreshProfilesIfStale);
    window.removeEventListener("pageshow", refreshProfilesIfStale);
    window.removeEventListener("online", setOnline);
    window.removeEventListener("offline", setOffline);
    document.removeEventListener("visibilitychange", refreshOnVisible);
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

export function listenPublicProfilesState(cb) {
  cb(profileState);
  profileSubscribers.add(cb);

  if (!profileResourceStarted) {
    profileResourceStarted = true;
    let stopApiRefresh = startProfileApiRefresh();
    let unsubPartners = () => {};
    let closed = false;

    if (useFirestore) {
      loadFirestore().then(({ collection, onSnapshot, query, where, db }) => {
        if (closed) return;
        const partnerQ = query(collection(db, "partners"), where("active", "==", true));

        unsubPartners = onSnapshot(partnerQ, (snap) => {
          publishProfiles(snap.docs.map((item) => normalizeProfile(item.id, "partner", item.data())), "firestore");
        }, () => fetchPublicProfilesWithRetry());
      }).catch(() => fetchPublicProfilesWithRetry());
    }

    const stopProfileResource = () => {
      closed = true;
      stopApiRefresh?.();
      unsubPartners();
    };
    window.addEventListener("beforeunload", stopProfileResource, { once: true });
  }

  return () => {
    profileSubscribers.delete(cb);
  };
}

export function getPublicProfilesState() {
  return profileState;
}

export function listenPublicProfiles(cb) {
  return listenPublicProfilesState((state) => cb(state.profiles));
}
