import { collection, onSnapshot, query, where } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, ChevronLeft, ChevronRight, Heart, Info, LogOut, MapPin, Menu, MessageCircle, RotateCcw, Settings, SlidersHorizontal, Star, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { openChat } from "../services/chatService";
import { sampleProfiles } from "../utils/sampleData";

export default function Discovery() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [remote, setRemote] = useState([]);
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const profiles = useMemo(() => (remote.length ? remote : sampleProfiles), [remote]);
  const profile = profiles[index % profiles.length];
  const photos = profile?.photos?.length ? profile.photos : [sampleProfiles[0].photos[0]];
  const visiblePhoto = photos[photoIndex % photos.length];

  useEffect(() => {
    const partnerQ = query(collection(db, "partners"), where("active", "==", true));
    const botQ = query(collection(db, "aiBots"), where("active", "==", true));
    const values = {};
    const emit = () => setRemote([...Object.values(values).flat()]);
    const unsubPartners = onSnapshot(partnerQ, (snap) => {
      values.partners = snap.docs.map((doc) => ({ id: doc.id, type: "partner", ...doc.data() }));
      emit();
    }, () => {});
    const unsubBots = onSnapshot(botQ, (snap) => {
      values.bots = snap.docs.map((doc) => ({ id: doc.id, type: "bot", ...doc.data() }));
      emit();
    }, () => {});
    return () => {
      unsubPartners();
      unsubBots();
    };
  }, []);

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.id]);

  useEffect(() => {
    if (photos.length <= 1) return undefined;
    const timer = setInterval(() => {
      setPhotoIndex((value) => (value + 1) % photos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [photos.length, profile?.id]);

  async function handleChat(target = profile) {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  function nextCard() {
    setIndex((value) => value + 1);
  }

  function prevPhoto() {
    setPhotoIndex((value) => (value - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    setPhotoIndex((value) => (value + 1) % photos.length);
  }

  function handleTouchEnd(event) {
    if (touchStart == null) return;
    const end = event.changedTouches[0].clientX;
    const diff = touchStart - end;
    if (Math.abs(diff) > 40) {
      diff > 0 ? nextPhoto() : prevPhoto();
    }
    setTouchStart(null);
  }

  const menuItems = [
    { label: "Discover", icon: Heart, action: () => navigate("/discovery") },
    { label: "Matches", icon: Star, action: () => navigate("/matches") },
    { label: "Messages", icon: MessageCircle, action: () => navigate("/messages") },
    { label: "Profile", icon: User, action: () => navigate("/profile") },
    { label: "Recharge", icon: Settings, action: () => navigate("/recharge") }
  ];

  return (
    <section className="phone-page px-6">
      <header className="grid grid-cols-3 items-center pb-8 pt-3">
        <button onClick={() => setMenuOpen(true)} className="justify-self-start rounded-full p-2 text-black active:bg-zinc-100"><Menu size={30} /></button>
        <h1 className="justify-self-center text-xl font-black">Discover</h1>
        <button onClick={() => setFilterOpen(true)} className="justify-self-end rounded-full p-2 text-black active:bg-zinc-100"><SlidersHorizontal size={30} /></button>
      </header>

      <motion.article
        key={profile.id}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
        className="relative h-[560px] overflow-hidden rounded-[28px] bg-zinc-100 shadow-[0_24px_40px_rgba(0,0,0,.14)]"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={visiblePhoto}
            src={visiblePhoto}
            alt={profile.name}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 glass-gradient" />
        <div className="absolute left-5 top-5 rounded-full bg-[#ff2f7e] px-5 py-3 text-base font-black text-white">New here</div>
        <div className="absolute right-5 top-5 rounded-full border border-white/45 bg-black/25 px-4 py-2 text-base font-black text-white">{photoIndex + 1}/{photos.length}</div>
        {photos.length > 1 && (
          <>
            <button onClick={prevPhoto} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronLeft size={25} /></button>
            <button onClick={nextPhoto} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronRight size={25} /></button>
            <div className="absolute left-5 right-5 top-[78px] flex gap-1.5">
              {photos.map((photo, idx) => (
                <button key={photo} onClick={() => setPhotoIndex(idx)} className={`h-1.5 flex-1 rounded-full ${idx === photoIndex ? "bg-white" : "bg-white/35"}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-7 left-5 right-5 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[34px] font-black leading-none">{profile.name}, {profile.age}</h2>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-white">✓</span>
          </div>
          <p className="mt-5 flex items-center gap-3 text-lg font-semibold"><Briefcase size={22} /> {profile.profession || "Product Designer"}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="flex items-center gap-3 text-lg font-semibold"><MapPin size={23} /> {profile.city || "Mumbai, India"}</p>
            <button onClick={() => handleChat(profile)} className="grid h-12 w-12 place-items-center rounded-full border-2 border-white text-white"><Info size={30} /></button>
          </div>
          {profile.type === "bot" && <span className="mt-4 inline-block rounded-full bg-white/18 px-4 py-2 text-sm font-black">AI Bot</span>}
        </div>
      </motion.article>

      <div className="mt-8 grid grid-cols-4 gap-6 px-4">
        <button onClick={nextCard} className="grid h-16 w-16 place-items-center rounded-full bg-white text-amber-400 shadow-[0_14px_30px_rgba(0,0,0,.10)]"><RotateCcw size={31} strokeWidth={3} /></button>
        <button onClick={nextCard} className="grid h-16 w-16 place-items-center rounded-full bg-white text-red-400 shadow-[0_14px_30px_rgba(0,0,0,.10)]"><X size={35} strokeWidth={3} /></button>
        <button onClick={() => handleChat(profile)} className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#f72565] shadow-[0_14px_30px_rgba(0,0,0,.10)]"><Heart size={35} fill="currentColor" strokeWidth={0} /></button>
        <button onClick={() => navigate("/recharge", { state: { reason: "Voice call needs diamonds after free preview." } })} className="grid h-16 w-16 place-items-center rounded-full bg-white text-purple-500 shadow-[0_14px_30px_rgba(0,0,0,.10)]"><Star size={35} fill="currentColor" strokeWidth={0} /></button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/35" />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 top-0 z-50 w-[310px] max-w-[82vw] -translate-x-[215px] bg-white px-6 py-8 shadow-2xl max-[430px]:left-0 max-[430px]:translate-x-0"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#f72565]">Friend Hub</h2>
                <button onClick={() => setMenuOpen(false)} className="rounded-full bg-zinc-100 p-2"><X size={22} /></button>
              </div>
              <div className="mt-8 space-y-2">
                {menuItems.map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setMenuOpen(false);
                      action();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-lg font-bold text-zinc-800 active:bg-[#fff0f5]"
                  >
                    <Icon className="text-[#f72565]" size={23} /> {label}
                  </button>
                ))}
              </div>
              <button onClick={logout} className="absolute bottom-8 left-6 right-6 flex items-center justify-center gap-2 rounded-full bg-zinc-100 py-4 font-black text-zinc-700">
                <LogOut size={21} /> Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFilterOpen(false)} className="fixed inset-0 z-40 bg-black/35" />
            <motion.div
              initial={{ y: 320 }}
              animate={{ y: 0 }}
              exit={{ y: 320 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-[32px] bg-white p-6 shadow-2xl"
            >
              <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-zinc-200" />
              <h2 className="text-2xl font-black">Filters</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {["Nearby", "New here", "Verified", "AI Bots", "Partners", "Online"].map((item) => (
                  <button key={item} className="rounded-full bg-[#fff0f5] px-4 py-3 font-bold text-[#f72565] active:scale-95">{item}</button>
                ))}
              </div>
              <button onClick={() => setFilterOpen(false)} className="pink-gradient mt-6 w-full rounded-full py-4 font-black text-white">Apply Filters</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
