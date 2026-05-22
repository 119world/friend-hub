import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black text-roseDeep">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">Use backend `ADMIN_TOKEN`.</p>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="mt-5 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        <button onClick={() => { localStorage.setItem("friendHubAdminToken", token); navigate("/"); }} className="mt-3 w-full rounded-xl bg-roseSoft py-3 font-semibold text-white">Enter Dashboard</button>
      </section>
    </main>
  );
}
