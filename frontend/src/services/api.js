import axios from "axios";

function normalizeApiUrl(value) {
  const base = String(value || "").replace(/\/+$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

function apiBaseUrl() {
  const configured = normalizeApiUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL);
  if (configured) return configured;
  if (import.meta.env.PROD) return "https://friend-hub-backend.onrender.com/api";
  return "http://localhost:8080/api";
}

const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 6000
});

api.interceptors.request.use(async (config) => {
  const path = String(config.url || "");
  try {
    const local = JSON.parse(localStorage.getItem("friendHubLocalProfile") || "null");
    if (local?.uid) {
      config.headers["x-guest-uid"] = local.uid;
      return config;
    }
  } catch {}
  if (path.startsWith("/public")) return config;
  const { auth } = await import("../firebase/firebase");
  const user = auth.currentUser;
  if (user && !user.isAnonymous) config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  if (user?.isAnonymous) config.headers["x-guest-uid"] = user.uid;
  return config;
});

export default api;
