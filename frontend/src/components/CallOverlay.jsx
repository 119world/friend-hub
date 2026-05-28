import { Mic, Phone, PhoneOff, Video, VideoOff, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function CallOverlay({ open, mode = "audio", contact, onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(mode !== "video");

  useEffect(() => {
    if (!open) return undefined;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  const photo = contact?.photo || contact?.targetPhoto;
  const name = contact?.name || contact?.targetName || "Friend";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <section className="relative min-h-[min(620px,calc(100dvh-24px))] w-full max-w-[430px] overflow-hidden rounded-[28px] bg-zinc-950 text-white shadow-2xl">
        {photo && <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-95" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/75" />

        <header className="relative z-10 flex items-start justify-between p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/75">Friend Hub {mode} call</p>
            <h2 className="mt-2 text-3xl font-black">{name}</h2>
            <p className="mt-1 text-sm font-semibold text-white/85">{seconds < 4 ? "Calling..." : `${minutes}:${rest}`}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/16 backdrop-blur">
            <X size={22} />
          </button>
        </header>

        {mode === "video" && (
          <div className="absolute right-5 top-32 z-10 h-36 w-24 overflow-hidden rounded-2xl border border-white/30 bg-black/35">
            <div className="grid h-full place-items-center text-center text-xs font-bold text-white/75">
              Your video
            </div>
          </div>
        )}

        <div className="absolute bottom-10 left-0 right-0 z-10 px-8">
          <div className="mb-8 flex justify-center gap-5">
            <button onClick={() => setMuted((value) => !value)} className="grid h-14 w-14 place-items-center rounded-full bg-white text-zinc-950">
              {muted ? <Mic size={24} className="text-rose-500" /> : <Mic size={24} />}
            </button>
            <button onClick={() => setVideoOff((value) => !value)} className="grid h-14 w-14 place-items-center rounded-full bg-white text-zinc-950">
              {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <button className="grid h-14 w-14 place-items-center rounded-full bg-white text-zinc-950">
              <Volume2 size={24} />
            </button>
          </div>
          <div className="flex justify-center gap-8">
            <button onClick={onClose} className="grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-xl">
              <PhoneOff size={30} fill="currentColor" />
            </button>
            <button className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-xl">
              <Phone size={30} fill="currentColor" />
            </button>
          </div>
          <p className="mt-5 text-center text-xs font-semibold text-white/70">UI-ready call shell. WebRTC signaling can plug into callSessions.</p>
        </div>
      </section>
    </div>
  );
}
