import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [loginId, setLoginId] = useState("mdibrahim");
  const [password, setPassword] = useState("Mdid@123");
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black text-roseDeep">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">Default: mdibrahim / Mdid@123. You can change it from Admin Accounts.</p>
        <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Admin ID" className="mt-5 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="mt-3 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        <details className="mt-3 rounded-xl bg-pink-50 p-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-bold text-roseDeep">Use token instead</summary>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" className="mt-3 w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
        </details>
        <button
          onClick={() => {
            if (token.trim()) localStorage.setItem("friendHubAdminToken", token.trim());
            localStorage.setItem("friendHubAdminSession", JSON.stringify({ loginId, password }));
            navigate("/");
          }}
          className="mt-3 w-full rounded-xl bg-roseSoft py-3 font-semibold text-white"
        >
          Enter Dashboard
        </button>
      </section>
    </main>
  );
}
