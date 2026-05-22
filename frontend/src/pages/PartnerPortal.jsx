import { ArrowLeft, Image, LogOut, Video } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PartnerPortal() {
  const navigate = useNavigate();
  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("friendHubPartnerSession") || "null");
    } catch {
      return null;
    }
  }, []);

  if (!session) {
    return (
      <main className="app-shell grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-black">Partner Login Required</h1>
          <button onClick={() => navigate("/login")} className="pink-gradient mt-5 rounded-full px-6 py-3 font-black text-white">Go Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen px-6 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate("/login")} className="rounded-full bg-zinc-100 p-3"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-black">Partner Studio</h1>
        <button
          onClick={() => {
            localStorage.removeItem("friendHubPartnerSession");
            navigate("/login");
          }}
          className="rounded-full bg-zinc-100 p-3"
        >
          <LogOut size={21} />
        </button>
      </header>

      <section className="mt-8 rounded-[28px] bg-white p-5 shadow-soft">
        <p className="text-sm font-black text-[#f72565]">Logged in</p>
        <h2 className="mt-2 text-3xl font-black">{session.loginId}</h2>
        <p className="mt-2 text-sm font-semibold text-zinc-500">Partner ID: {session.partnerId}</p>
      </section>

      <section className="mt-5 grid gap-4">
        <div className="rounded-[24px] bg-[#fff0f5] p-5">
          <Image className="text-[#f72565]" size={28} />
          <h3 className="mt-3 text-lg font-black">Photos</h3>
          <p className="mt-2 text-sm font-semibold text-zinc-600">Admin panel se 3-7 profile photos manage karo.</p>
        </div>
        <div className="rounded-[24px] bg-zinc-100 p-5">
          <Video className="text-zinc-700" size={28} />
          <h3 className="mt-3 text-lg font-black">Videos</h3>
          <p className="mt-2 text-sm font-semibold text-zinc-600">Admin panel se 2-3 premium videos add karo.</p>
        </div>
      </section>
    </main>
  );
}
