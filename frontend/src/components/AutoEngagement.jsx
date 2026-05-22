import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { openChat } from "../services/chatService";
import { sampleProfiles } from "../utils/sampleData";
import CallOverlay from "./CallOverlay";

const prompts = [
  "Hey, are you online?",
  "I just saw your profile.",
  "Want to talk for a minute?",
  "I sent you a message."
];

export default function AutoEngagement() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [callMode, setCallMode] = useState(null);
  const diamonds = Number(profile?.diamonds || 0);

  useEffect(() => listenPublicProfiles(setProfiles), []);

  const candidates = useMemo(() => {
    const adminProfiles = profiles.filter((item) => item.allowAutoContact !== false && item.showInMatches !== false);
    return adminProfiles.length ? adminProfiles : sampleProfiles;
  }, [profiles]);

  useEffect(() => {
    if (!user || diamonds > 0 || location.pathname.startsWith("/recharge")) {
      setPrompt(null);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPrompt((current) => {
        if (current) return current;
        const target = candidates[Math.floor(Math.random() * candidates.length)] || sampleProfiles[0];
        const mode = Math.random() > 0.45 ? "message" : (Math.random() > 0.5 ? "audio" : "video");
        return {
          id: `${target.id}_${Date.now()}`,
          target,
          mode,
          text: target.welcomeMessage || prompts[Math.floor(Math.random() * prompts.length)]
        };
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [candidates, diamonds, location.pathname, user]);

  async function acceptPrompt() {
    if (!prompt) return;
    if (prompt.mode === "message") {
      const chatId = await openChat({ user, target: prompt.target });
      setPrompt(null);
      navigate(`/chat/${chatId}`);
      return;
    }
    setPrompt(null);
    navigate("/recharge", { state: { reason: `Recharge diamonds to answer ${prompt.target.name}'s ${prompt.mode} call.` } });
  }

  function closeCall() {
    setCallMode(null);
    setPrompt(null);
    navigate("/recharge", { state: { reason: "Recharge diamonds to continue voice/video calls securely." } });
  }

  if (diamonds > 0) return null;

  return (
    <>
      <AnimatePresence>
        {prompt && !callMode && (
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.98 }}
            className="fixed bottom-[118px] left-1/2 z-40 w-[calc(100%-28px)] max-w-[402px] -translate-x-1/2 rounded-[26px] bg-white p-4 shadow-[0_22px_60px_rgba(0,0,0,.22)]"
          >
            <div className="flex items-center gap-3">
              <img src={prompt.target.photos?.[0] || sampleProfiles[0].photos[0]} alt="" className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black">{prompt.target.name}</p>
                <p className="truncate text-sm font-semibold text-zinc-500">
                  {prompt.mode === "message" ? prompt.text : `${prompt.mode === "video" ? "Video" : "Audio"} call incoming`}
                </p>
              </div>
              <button onClick={() => setPrompt(null)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setPrompt(null)} className="rounded-full bg-zinc-100 py-3 text-sm font-black text-zinc-700">Later</button>
              <button onClick={acceptPrompt} className="pink-gradient flex items-center justify-center gap-2 rounded-full py-3 text-sm font-black text-white">
                {prompt.mode === "video" ? <Video size={18} /> : prompt.mode === "audio" ? <Phone size={18} /> : <MessageCircle size={18} />}
                {prompt.mode === "message" ? "Reply" : "Answer"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CallOverlay
        open={Boolean(callMode && prompt)}
        mode={callMode || "audio"}
        contact={{ name: prompt?.target?.name || "Friend", photo: prompt?.target?.photos?.[0] || sampleProfiles[0].photos[0] }}
        onClose={closeCall}
      />
    </>
  );
}
