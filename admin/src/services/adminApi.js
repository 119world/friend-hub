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

const adminApi = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 7000
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("friendHubAdminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("friendHubAdminToken");
      localStorage.removeItem("friendHubAdminSession");
    }
    return Promise.reject(error);
  }
);

export function hasAdminSession() {
  return Boolean(localStorage.getItem("friendHubAdminToken"));
}

export function saveAdminSession({ token, admin }) {
  localStorage.setItem("friendHubAdminToken", token);
  localStorage.setItem("friendHubAdminSession", JSON.stringify({
    loginId: admin?.loginId || "admin",
    displayName: admin?.displayName || "Admin User",
    role: admin?.role || "admin"
  }));
}

export function clearAdminSession() {
  localStorage.removeItem("friendHubAdminToken");
  localStorage.removeItem("friendHubAdminSession");
}

export default adminApi;
