import axios from "axios";

function apiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return "http://localhost:8080/api";
  return base.endsWith("/api") ? base : `${base}/api`;
}

const adminApi = axios.create({
  baseURL: apiBaseUrl()
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
