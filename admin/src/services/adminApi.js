import axios from "axios";

function normalizeApiUrl(value) {
  const base = String(value || "").replace(/\/+$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

function apiBaseUrl() {
  return normalizeApiUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) || "http://localhost:8080/api";
}

const adminApi = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 7000
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("friendHubAdminToken") || import.meta.env.VITE_ADMIN_TOKEN;
  const session = JSON.parse(localStorage.getItem("friendHubAdminSession") || "null");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (session?.loginId && session?.password) {
    config.headers["x-admin-id"] = session.loginId;
    config.headers["x-admin-password"] = session.password;
  }
  return config;
});

export default adminApi;
