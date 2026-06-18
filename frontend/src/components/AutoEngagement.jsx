import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, Video, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePublicProfiles } from "../hooks/usePublicProfiles";
import { openChat } from "../services/chatService";
import CallOverlay from "./CallOverlay";

const prompts = [
  "Hey, are you online?",
  "I just saw your profile.",
  "Want to talk for a minute?",
  "I sent you a message."
];
const blockedPaths = ["/login", "/recharge", "/profile", "/partner"];
const POPUP_MIN_MS = 5000;
const POPUP_MAX_MS = 7000;

function randomPopupDuration() {
  return POPUP_MIN_MS + Math.floor(Math.random() * (POPUP_MAX_MS - POPUP_MIN_MS + 1));
}

export default function AutoEngagement() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profiles } = usePublicProfiles();
  const [prompt, setPrompt] = useState(null);
  const [callMode, setCallMode] = useState(null);
  const popupTimer = useRef(null);
  const diamonds = Number(profile?.diamonds || 0);
  const [snoozeUntil, setSnoozeUntil] = useState(() => Number(localStorage.getItem("friendHubPromptSnoozeUntil") || 0));

  const candidates = useMemo(() => {
    const adminProfiles = profiles.filter((item) => item.allowAutoContact !== false && item.showInMatches !== false);
    return adminProfiles;
  }, [profiles]);

  useEffect(() => {
    const now = Date.now();
    if (
      !user ||
      diamonds > 0 ||
      !candidates.length ||
      blockedPaths.some((path) => location.pathname.startsWith(path)) ||
      now < snoozeUntil
    ) {
      setPrompt(null);
      setCallMode(null);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPrompt((current) => {
        if (current) return current;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        if (!target) return null;
        const mode = Math.random() > 0.45 ? "message" : (Math.random() > 0.5 ? "audio" : "video");
        return {
          id: `${target.id}_${Date.now()}`,
          target,
          mode,
          text: target.welcomeMessage || prompts[Math.floor(Math.random() * prompts.length)]
        };
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [candidates, diamonds, location.pathname, snoozeUntil, user]);

  useEffect(() => {
    window.clearTimeout(popupTimer.current);
    if (!prompt || callMode) return undefined;
    popupTimer.current = window.setTimeout(() => {
      setPrompt(null);
    }, randomPopupDuration());
    return () => window.clearTimeout(popupTimer.current);
  }, [callMode, prompt]);

  async function acceptPrompt() {
    if (!prompt) return;
    window.clearTimeout(popupTimer.current);
    if (prompt.mode === "message") {
      const chatId = await openChat({ user, target: prompt.target });
      setPrompt(null);
      navigate(`/chat/${chatId}`);
      return;
    }
    setPrompt(null);
    navigate("/recharge", { state: { reason: `Recharge diamonds to answer ${prompt.target.name}'s ${prompt.mode} call.` } });
  }

  async function openPromptTarget() {
    if (!prompt) return;
    window.clearTimeout(popupTimer.current);
    if (prompt.mode === "message") {
      await acceptPrompt();
      return;
    }
    const target = prompt.target;
    setPrompt(null);
    navigate(`/people/${target.id}`, { state: { profile: target } });
  }

  function closeCall() {
    window.clearTimeout(popupTimer.current);
    setCallMode(null);
    setPrompt(null);
    const until = Date.now() + 30 * 60 * 1000;
    setSnoozeUntil(until);
    localStorage.setItem("friendHubPromptSnoozeUntil", String(until));
  }

  function dismissPrompt() {
    window.clearTimeout(popupTimer.current);
    const until = Date.now() + 30 * 60 * 1000;
    setPrompt(null);
    setSnoozeUntil(until);
    localStorage.setItem("friendHubPromptSnoozeUntil", String(until));
  }

  if (diamonds > 0) return null;

  return (
    <>
      <AnimatePresence>
        {prompt && !callMode && (
          <div className="fixed inset-x-0 bottom-[calc(82px+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 pointer-events-none">
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 36, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="pointer-events-auto relative w-full max-w-[400px] rounded-[24px] bg-white p-3 shadow-[0_22px_60px_rgba(0,0,0,.22)] ring-1 ring-black/5"
            >
              <button onClick={openPromptTarget} className="flex w-full items-center gap-3 rounded-[18px] p-1 text-left active:bg-zinc-50">
                {prompt.target.photos?.[0] ? (
                  <img src={prompt.target.photos[0]} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="skeleton h-14 w-14 shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black">{prompt.target.name}</p>
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-500">
                    {prompt.mode === "message" ? prompt.text : `${prompt.mode === "video" ? "Video" : "Audio"} call`}
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[#f72565]">
                  {prompt.mode === "video" ? <Video size={17} /> : prompt.mode === "audio" ? <Phone size={17} /> : <MessageCircle size={17} />}
                </span>
              </button>
              <div className="mt-3 grid grid-cols-[1fr_1.1fr] gap-2">
                <button onClick={dismissPrompt} className="min-h-11 rounded-full bg-zinc-100 px-3 py-3 text-sm font-black text-zinc-700">Later</button>
                <button onClick={acceptPrompt} className="pink-gradient flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-black text-white">
                  {prompt.mode === "message" ? "Open" : "Answer"}
                </button>
              </div>
              <button onClick={dismissPrompt} className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-500 shadow-md">
                <X size={16} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CallOverlay
        open={Boolean(callMode && prompt)}
        mode={callMode || "audio"}
        contact={{ name: prompt?.target?.name || "Friend", photo: prompt?.target?.photos?.[0] || "" }}
        onClose={closeCall}
      />
    </>
  );
}
