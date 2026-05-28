import { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi, { saveAdminSession } from "../services/adminApi";

export default function AdminLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = token.trim()
        ? { adminToken: token.trim() }
        : { loginId: loginId.trim(), password };
      const { data } = await adminApi.post("/admin/login", payload);
      if (!data?.token) throw new Error("Missing admin token");
      saveAdminSession(data);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid admin credentials");
      } else {
        setError("Server connection failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black text-roseDeep">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">Use your admin credentials to continue.</p>
        <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Admin ID" autoComplete="username" className="mt-5 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete="current-password" className="mt-3 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        <details className="mt-3 rounded-xl bg-pink-50 p-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-bold text-roseDeep">Use token instead</summary>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="mt-3 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        </details>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
        <button
          disabled={busy || (!token.trim() && (!loginId.trim() || !password))}
          className="mt-3 w-full rounded-xl bg-roseSoft py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Checking..." : "Enter Dashboard"}
        </button>
      </form>
    </main>
  );
}
