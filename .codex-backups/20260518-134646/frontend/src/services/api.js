import axios from "axios";
import { auth } from "../firebase/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user && !user.isAnonymous) {
    config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  if (user?.isAnonymous) {
    config.headers["x-guest-uid"] = user.uid;
  }
  return config;
});

export default api;
