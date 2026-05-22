import axios from "axios";

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("friendHubAdminToken") || import.meta.env.VITE_ADMIN_TOKEN;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminApi;
