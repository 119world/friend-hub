import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Check, ChevronLeft, ChevronRight, Heart, Info, LogOut, MapPin, Menu, MessageCircle, Navigation, RotateCcw, Settings, SlidersHorizontal, Star, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { openChat } from "../services/chatService";
import { haversineKm } from "../utils/distance";
import { sampleProfiles } from "../utils/sampleData";

export default function Discovery() {
  const { user, profile: myProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [remote, setRemote] = useState([]);
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [filters, setFilters] = useState({ type: "all", onlineOnly: false, verifiedOnly: false, minAge: 18, maxAge: 45, distanceKm: "all", interest: "" });

  const profiles = useMemo(() => {
    const adminSource = remote.filter((item) => item.showInDiscovery !== false);
    const source = adminSource.length ? adminSource : sampleProfiles;
    const filtered = source.filter((item) => {
      const age = Number(item.age || 0);
      const matchesType = filters.type === "all" || item.type === filters.type;
      const matchesOnline = !filters.onlineOnly || item.online !== false;
      const matchesVerified = !filters.verifiedOnly || item.verified !== false;
      const matchesAge = age >= Number(filters.minAge || 18) && age <= Number(filters.maxAge || 99);
      const matchesInterest = !filters.interest || (item.interests || []).join(" ").toLowerCase().includes(filters.interest.toLowerCase());
      const itemDistance = Number(item.distanceKm ?? haversineKm(
        { lat: myProfile?.lat || myProfile?.latitude || 19.076, lng: myProfile?.lng || myProfile?.longitude || 72.8777 },
        { lat: item.lat || item.latitude, lng: item.lng || item.longitude }
      ));
      const matchesDistance = filters.distanceKm === "all" || !Number.isFinite(itemDistance) || itemDistance <= Number(filters.distanceKm);
      return matchesType && matchesOnline && matchesVerified && matchesAge && matchesDistance && matchesInterest;
    });
    return filtered.length ? filtered : source;
  }, [remote, filters, myProfile]);
  const profile = profiles[index % profiles.length] || sampleProfiles[0];
  const media = [
    ...(profile?.photos?.length ? profile.photos.slice(0, 7).map((url) => ({ type: "image", url })) : []),
    ...(profile?.videos?.length ? profile.videos.slice(0, 3).map((url) => ({ type: "video", url })) : [])
  ];
  const visibleMedia = media[photoIndex % media.length] || { type: "image", url: sampleProfiles[0].photos[0] };

  useEffect(() => {
    return listenPublicProfiles(setRemote);
  }, []);

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.id]);

  useEffect(() => {
    setIndex(0);
  }, [filters]);

  useEffect(() => {
    if (media.length <= 1) return undefined;
    const timer = setInterval(() => {
      setPhotoIndex((value) => (value + 1) % media.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [media.length, profile?.id]);

  async function handleChat(target = profile) {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  function nextCard() {
    setIndex((value) => value + 1);
  }

  function prevPhoto() {
    if (!media.length) return;
    setPhotoIndex((value) => (value - 1 + media.length) % media.length);
  }

  function nextPhoto() {
    if (!media.length) return;
    setPhotoIndex((value) => (value + 1) % media.length);
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
      <PhoneStatusBar />
      <header className="grid grid-cols-3 items-center pb-8 pt-7">
        <button onClick={() => setMenuOpen(true)} className="justify-self-start rounded-full p-2 text-black active:bg-zinc-100"><Menu size={30} /></button>
        <h1 className="justify-self-center text-[22px] font-black">Discover</h1>
        <button onClick={() => setFilterOpen(true)} className="justify-self-end rounded-full p-2 text-black active:bg-zinc-100"><SlidersHorizontal size={30} /></button>
      </header>

      <motion.article
        key={profile.id}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
        className="mock-card-shadow relative h-[550px] overflow-hidden rounded-[28px] bg-zinc-100"
      >
        <AnimatePresence mode="wait">
          {visibleMedia.type === "video" ? (
            <motion.video
              key={visibleMedia.url}
              src={visibleMedia.url}
              muted
              loop
              playsInline
              autoPlay
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <motion.img
              key={visibleMedia.url}
              src={visibleMedia.url}
              alt={profile.name}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 glass-gradient" />
        <div className="absolute left-5 top-5 rounded-full bg-[#ff2f7e] px-5 py-3 text-base font-black text-white">{profile.type === "bot" ? "AI friend" : "New here"}</div>
        <div className="absolute right-5 top-5 rounded-full border border-white/45 bg-black/25 px-4 py-2 text-base font-black text-white">{photoIndex + 1}/{media.length || 1}</div>
        {media.length > 1 && (
          <>
            <button onClick={prevPhoto} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronLeft size={25} /></button>
            <button onClick={nextPhoto} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronRight size={25} /></button>
            <div className="absolute left-5 right-5 top-[78px] flex gap-1.5">
              {media.map((item, idx) => (
                <button key={item.url} onClick={() => setPhotoIndex(idx)} className={`h-1.5 flex-1 rounded-full ${idx === photoIndex ? "bg-white" : "bg-white/35"}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-7 left-5 right-5 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[34px] font-black leading-none">{profile.name}, {profile.age}</h2>
            {profile.verified !== false && <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-white"><Check size={22} strokeWidth={4} /></span>}
          </div>
          <p className="mt-5 flex items-center gap-3 text-lg font-semibold"><Briefcase size={22} /> {profile.profession || "Product Designer"}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="flex items-center gap-3 text-lg font-semibold"><MapPin size={23} /> {profile.city || "Mumbai, India"}</p>
            <button onClick={() => navigate(`/people/${profile.id}`, { state: { profile } })} className="grid h-12 w-12 place-items-center rounded-full border-2 border-white text-white"><Info size={30} /></button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-black text-white/90"><Navigation size={16} /> {Number(profile.distanceKm || 2)} km nearby</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.interests || []).slice(0, 3).map((item) => (
              <span key={item} className="rounded-full bg-white/18 px-3 py-1 text-xs font-black">{item}</span>
            ))}
          </div>
        </div>
      </motion.article>

      <div className="mt-8 grid grid-cols-4 gap-6 px-4">
        <button onClick={nextCard} className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-amber-400 shadow-[0_18px_34px_rgba(0,0,0,.10)]"><RotateCcw size={33} strokeWidth={3} /></button>
        <button onClick={nextCard} className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-red-400 shadow-[0_18px_34px_rgba(0,0,0,.10)]"><X size={36} strokeWidth={3} /></button>
        <button onClick={() => handleChat(profile)} className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-[#f72565] shadow-[0_18px_34px_rgba(0,0,0,.10)]"><Heart size={36} fill="currentColor" strokeWidth={0} /></button>
        <button onClick={() => navigate("/recharge", { state: { reason: "Voice call needs diamonds after free preview." } })} className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-purple-500 shadow-[0_18px_34px_rgba(0,0,0,.10)]"><Star size={36} fill="currentColor" strokeWidth={0} /></button>
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
              initial={{ y: 340 }}
              animate={{ y: 0 }}
              exit={{ y: 340 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-[32px] bg-white p-6 shadow-2xl"
            >
              <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-zinc-200" />
              <h2 className="text-2xl font-black">Filters</h2>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["all", "All"],
                  ["partner", "Partners"],
                  ["bot", "AI Bots"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilters((old) => ({ ...old, type: value }))}
                    className={`rounded-full px-3 py-3 text-sm font-bold active:scale-95 ${filters.type === value ? "pink-gradient text-white" : "bg-[#fff0f5] text-[#f72565]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => setFilters((old) => ({ ...old, onlineOnly: !old.onlineOnly }))} className={`rounded-full px-4 py-3 font-bold ${filters.onlineOnly ? "pink-gradient text-white" : "bg-zinc-100 text-zinc-700"}`}>Online</button>
                <button onClick={() => setFilters((old) => ({ ...old, verifiedOnly: !old.verifiedOnly }))} className={`rounded-full px-4 py-3 font-bold ${filters.verifiedOnly ? "pink-gradient text-white" : "bg-zinc-100 text-zinc-700"}`}>Verified</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <input value={filters.minAge} onChange={(e) => setFilters((old) => ({ ...old, minAge: e.target.value }))} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Min age" />
                <input value={filters.maxAge} onChange={(e) => setFilters((old) => ({ ...old, maxAge: e.target.value }))} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Max age" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["all", "2", "3", "5"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilters((old) => ({ ...old, distanceKm: value }))}
                    className={`rounded-full px-3 py-3 text-sm font-bold ${filters.distanceKm === value ? "pink-gradient text-white" : "bg-zinc-100 text-zinc-700"}`}
                  >
                    {value === "all" ? "Any" : `${value} km`}
                  </button>
                ))}
              </div>
              <input value={filters.interest} onChange={(e) => setFilters((old) => ({ ...old, interest: e.target.value }))} className="mt-4 w-full rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Interest e.g. travel" />
              <button onClick={() => setFilterOpen(false)} className="pink-gradient mt-6 w-full rounded-full py-4 font-black text-white">Apply Filters</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
