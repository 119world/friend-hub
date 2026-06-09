import { db, hasFirestoreCredentials } from "../config/firebaseAdmin.js";
import { listLocalResource, getLocalResource } from "../services/localDataStore.js";

const defaultPlans = [
  { id: "first_9", title: "First-time Offer", originalPrice: 19, price: 9, diamonds: 30, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 9 },
  { id: "normal_19", title: "Starter", originalPrice: 49, price: 19, diamonds: 50, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 19 },
  { id: "offer_49", title: "Friend Offer", originalPrice: 199, price: 49, diamonds: 160, minutes: 4, active: true, subscription: false, autoPay: true, autoPayAmount: 49 },
  { id: "premium_99", title: "Premium Offer", originalPrice: 399, price: 99, diamonds: 360, minutes: 10, active: true, subscription: true, autoPay: true, autoPayAmount: 99 }
];

const defaultWelcome = {
  title: "Meet New Friends. Build Real Connections.",
  subtitle: "Friend Hub is a social networking platform where users can discover people, chat safely, and build interest-based friendships.",
  bgPhoto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
  maintenanceMode: false,
  maintenanceTitle: "Friend Hub is updating",
  maintenanceMessage: "We are polishing the app. Please check again in a few minutes.",
  maintenanceActionLabel: "",
  maintenanceActionUrl: ""
};

const defaultReplyConfig = {
  welcomeMessage: "Hey! How's your weekend going?",
  firstReply: "That sounds amazing! I love hiking too.",
  secondReply: "Definitely! I'd love that.",
  limitReachedMessage: "You have used the free chat preview.",
  rechargeMessage: "Recharge to continue this conversation.",
  replyLimit: 2,
  delayMs: 650
};

function clean(value) {
  return String(value || "").trim();
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
    active: data.active !== false,
    showInDiscovery: data.showInDiscovery !== false,
    showInMatches: data.showInMatches !== false,
    allowAutoContact: data.allowAutoContact !== false
  };
}

async function listCollection(name, options = {}) {
  if (hasFirestoreCredentials) {
    try {
      const ref = options.activeOnly ? db.collection(name).where("active", "==", true) : db.collection(name);
      const snap = await ref.limit?.(1000)?.get?.() || await ref.get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {
      if (options.localFallback === false) return [];
    }
  }
  return listLocalResource(name);
}

async function listPartnerAccounts(options = {}) {
  let items = [];
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("partnerAccounts").limit(1000).get();
      items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch {
      if (options.localFallback === false) return [];
    }
  }
  if (!items.length) items = await listLocalResource("partnerAccounts");
  return items.filter((item) => item.active !== false);
}

function profileFromAccount(account) {
  const id = clean(account.partnerId || account.id || `partner_${account.loginId}`);
  const name = clean(account.displayName || account.name || account.loginId || "Partner");
  return normalizeProfile(id, "partner", {
    id,
    partnerId: id,
    type: "partner",
    name,
    username: clean(account.loginId),
    age: Number(account.age || 24),
    gender: account.gender || "Woman",
    city: clean(account.city || account.location || "India"),
    location: clean(account.location || account.city || "India"),
    profession: clean(account.profession || "Friend Hub Partner"),
    bio: clean(account.bio || "Friendly profile on Friend Hub."),
    interests: Array.isArray(account.interests) && account.interests.length ? account.interests : ["Chatting"],
    photos: Array.isArray(account.photos) && account.photos.length ? account.photos : [],
    galleryPhotos: Array.isArray(account.galleryPhotos) && account.galleryPhotos.length ? account.galleryPhotos : [],
    videos: Array.isArray(account.videos) ? account.videos : [],
    welcomeMessage: clean(account.welcomeMessage || "Hey! Thanks for connecting."),
    online: account.online !== false,
    verified: account.verified !== false,
    showInDiscovery: account.showInDiscovery !== false,
    showInMatches: account.showInMatches !== false,
    allowAutoContact: account.allowAutoContact !== false,
    active: account.active !== false
  });
}

export async function publicProfiles(req, res) {
  const [partnerItems, partnerAccounts] = await Promise.all([
    listCollection("partners", { activeOnly: true, localFallback: !hasFirestoreCredentials }),
    listPartnerAccounts({ localFallback: !hasFirestoreCredentials })
  ]);

  const partners = partnerItems
    .filter((item) => item.active !== false)
    .map((item) => normalizeProfile(item.id, "partner", item));
  const knownPartnerIds = new Set(partners.map((item) => clean(item.id || item.partnerId)));
  const accountProfiles = partnerAccounts
    .map(profileFromAccount)
    .filter((item) => item.active !== false && item.showInDiscovery !== false && !knownPartnerIds.has(clean(item.id)));
  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
  res.json({ items: [...accountProfiles, ...partners] });
}

export async function publicPlans(req, res) {
  const plans = (await listCollection("plans", { activeOnly: true })).filter((item) => item.active !== false);
  res.json({ items: plans.length ? plans : defaultPlans });
}

export async function publicWelcome(req, res) {
  let item = null;
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("appSettings").doc("welcome").get();
      if (snap.exists) item = { id: snap.id, ...snap.data() };
    } catch {}
  }
  item ||= await getLocalResource("appSettings", "welcome");
  res.json({ item: { ...defaultWelcome, ...(item || {}) } });
}

export async function publicReplyConfig(req, res) {
  let item = null;
  if (hasFirestoreCredentials) {
    try {
      const snap = await db.collection("replyTemplates").doc("default").get();
      if (snap.exists) item = { id: snap.id, ...snap.data() };
    } catch {}
  }
  item ||= await getLocalResource("replyTemplates", "default");
  res.json({ item: { ...defaultReplyConfig, ...(item || {}) } });
}
