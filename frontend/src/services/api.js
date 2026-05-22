import axios from "axios";
import { auth } from "../firebase/firebase";

function apiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return "http://localhost:8080/api";
  return base.endsWith("/api") ? base : `${base}/api`;
}

const api = axios.create({
  baseURL: apiBaseUrl()
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user && !user.isAnonymous) {
    config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  if (user?.isAnonymous) {
    config.headers["x-guest-uid"] = user.uid;
  }
  if (!user) {
    try {
      const local = JSON.parse(localStorage.getItem("friendHubLocalProfile") || "null");
      if (local?.uid) config.headers["x-guest-uid"] = local.uid;
    } catch {}
  }
  return config;
});

export default api;
