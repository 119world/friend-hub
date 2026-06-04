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
  const [remote, setRemote] = useState(null);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [photoIndexes, setPhotoIndexes] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [filters, setFilters] = useState({ type: "all", onlineOnly: false, verifiedOnly: false, minAge: 18, maxAge: 45, distanceKm: "all", interest: "" });

  const profiles = useMemo(() => {
    const adminSource = Array.isArray(remote) ? remote.filter((item) => item.showInDiscovery !== false) : [];
    const source = remote === null ? sampleProfiles : adminSource;
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
    return filtered.length || remote !== null ? filtered : source;
  }, [remote, filters, myProfile]);
  const visibleProfiles = useMemo(() => {
    const available = profiles.filter((item) => !dismissedIds.includes(item.id));
    return available.length ? available : profiles;
  }, [dismissedIds, profiles]);

  useEffect(() => {
    return listenPublicProfiles(setRemote);
  }, []);

  useEffect(() => {
    setDismissedIds([]);
    setPhotoIndexes({});
  }, [filters]);

  useEffect(() => {
    const firstProfile = visibleProfiles[0];
    const mediaLength = getMedia(firstProfile).length;
    if (!firstProfile || mediaLength <= 1) return undefined;
    const timer = setInterval(() => {
      setPhotoIndexes((old) => ({
        ...old,
        [firstProfile.id]: ((old[firstProfile.id] || 0) + 1) % mediaLength
      }));
    }, 3500);
    return () => clearInterval(timer);
  }, [visibleProfiles]);

  function getMedia(target) {
    return [
      ...(target?.photos?.length ? target.photos.slice(0, 7).map((url) => ({ type: "image", url })) : []),
      ...(target?.videos?.length ? target.videos.slice(0, 3).map((url) => ({ type: "video", url })) : [])
    ];
  }

  function openProfile(target) {
    navigate(`/people/${target.id}`, { state: { profile: target } });
  }

  async function handleChat(target) {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  function nextCard(target) {
    setDismissedIds((old) => old.includes(target.id) ? old : [...old, target.id]);
  }

  function prevPhoto(target) {
    const media = getMedia(target);
    if (!media.length) return;
    setPhotoIndexes((old) => ({
      ...old,
      [target.id]: ((old[target.id] || 0) - 1 + media.length) % media.length
    }));
  }

  function nextPhoto(target) {
    const media = getMedia(target);
    if (!media.length) return;
    setPhotoIndexes((old) => ({
      ...old,
      [target.id]: ((old[target.id] || 0) + 1) % media.length
    }));
  }

  function handleTouchEnd(event, target) {
    if (touchStart?.id !== target.id) return;
    const end = event.changedTouches[0].clientX;
    const diff = touchStart.x - end;
    if (Math.abs(diff) > 40) {
      diff > 0 ? nextPhoto(target) : prevPhoto(target);
    }
    setTouchStart(null);
  }

  const menuItems = [
    { label: "Discover", icon: Heart, action: () => navigate("/discovery") },
    { label: "Connections", icon: Star, action: () => navigate("/matches") },
    { label: "Messages", icon: MessageCircle, action: () => navigate("/messages") },
    { label: "Profile", icon: User, action: () => navigate("/profile") },
    { label: "Recharge", icon: Settings, action: () => navigate("/recharge") }
  ];

  return (
    <section className="phone-page discover-page">
      <PhoneStatusBar />
      <header className="grid grid-cols-[44px_1fr_44px] items-center pb-4 pt-5">
        <button onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center justify-self-start rounded-full text-black active:bg-zinc-100"><Menu size={28} /></button>
        <h1 className="justify-self-center text-center text-[18px] font-black min-[390px]:text-[20px]">Discover New Friends</h1>
        <button onClick={() => setFilterOpen(true)} className="grid h-11 w-11 place-items-center justify-self-end rounded-full text-black active:bg-zinc-100"><SlidersHorizontal size={28} /></button>
      </header>

      <div className="space-y-5">
        {remote !== null && !visibleProfiles.length && (
          <div className="rounded-[28px] bg-zinc-50 px-5 py-10 text-center">
            <h2 className="text-xl font-black">No profiles available</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-500">Admin panel se partner profile add karo, phir yahan automatically show hogi.</p>
          </div>
        )}
        {visibleProfiles.map((item, cardIndex) => {
          const media = getMedia(item);
          const photoIndex = photoIndexes[item.id] || 0;
          const visibleMedia = media[photoIndex % media.length] || { type: "image", url: sampleProfiles[0].photos[0] };
          return (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(cardIndex * 0.025, 0.12) }}
              onClick={() => openProfile(item)}
              onTouchStart={(event) => setTouchStart({ id: item.id, x: event.touches[0].clientX })}
              onTouchEnd={(event) => handleTouchEnd(event, item)}
              className="mock-card-shadow overflow-hidden rounded-[28px] bg-white active:scale-[0.99]"
            >
              <div className="relative h-[min(82vw,410px)] min-h-[318px] overflow-hidden bg-zinc-100">
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
                      alt={item.name}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 glass-gradient" />
                <div className="absolute left-4 top-4 rounded-full bg-[#ff2f7e] px-4 py-2 text-sm font-black text-white">{item.type === "bot" ? "Friend Hub" : "New here"}</div>
                <div className="absolute right-4 top-4 rounded-full border border-white/45 bg-black/25 px-3 py-1.5 text-sm font-black text-white">{photoIndex + 1}/{media.length || 1}</div>
                {media.length > 1 && (
                  <>
                    <button onClick={(event) => { event.stopPropagation(); prevPhoto(item); }} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronLeft size={25} /></button>
                    <button onClick={(event) => { event.stopPropagation(); nextPhoto(item); }} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur"><ChevronRight size={25} /></button>
                    <div className="absolute left-5 right-5 top-[72px] flex gap-1.5">
                      {media.map((mediaItem, idx) => (
                        <button
                          key={mediaItem.url}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPhotoIndexes((old) => ({ ...old, [item.id]: idx }));
                          }}
                          className="flex h-11 flex-1 items-start pt-3"
                          aria-label={`Show media ${idx + 1}`}
                        >
                          <span className={`h-1.5 w-full rounded-full ${idx === photoIndex ? "bg-white" : "bg-white/35"}`} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute bottom-5 left-4 right-4 text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="min-w-0 truncate text-[30px] font-black leading-none min-[390px]:text-[34px]">{item.name}, {item.age}</h2>
                    {item.verified !== false && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500 text-white"><Check size={19} strokeWidth={4} /></span>}
                  </div>
                  <p className="mt-3 flex min-w-0 items-center gap-2 text-sm font-semibold min-[390px]:text-base"><Briefcase size={19} className="shrink-0" /> <span className="truncate">{item.profession || item.personality || "Friend Hub Partner"}</span></p>
                  <p className="mt-3 flex min-w-0 items-center gap-2 text-sm font-semibold min-[390px]:text-base"><MapPin size={20} className="shrink-0" /> <span className="truncate">{item.location || item.city || "Nearby"}</span></p>
                </div>
              </div>
              <div className="px-4 pb-4 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-black text-zinc-500"><Navigation size={16} className="shrink-0" /> {Number(item.distanceKm || 2)} km nearby</p>
                  <button onClick={(event) => { event.stopPropagation(); openProfile(item); }} className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff0f5] px-3 py-2 text-xs font-black text-[#f72565]"><Info size={15} /> View</button>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-zinc-600">{item.bio || "Verified profile for friendly chat and calls."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(item.interests || []).slice(0, 4).map((interest) => (
                    <span key={interest} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">{interest}</span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={(event) => { event.stopPropagation(); nextCard(item); }} className="flex min-h-12 items-center justify-center gap-1 rounded-full bg-zinc-100 px-2 text-sm font-black text-zinc-600"><X size={18} /> Pass</button>
                  <button onClick={(event) => { event.stopPropagation(); handleChat(item); }} className="flex min-h-12 items-center justify-center gap-1 rounded-full bg-[#fff0f5] px-2 text-sm font-black text-[#f72565]"><Heart size={18} fill="currentColor" /> Like</button>
                  <button onClick={(event) => { event.stopPropagation(); handleChat(item); }} className="pink-gradient flex min-h-12 items-center justify-center gap-1 rounded-full px-2 text-sm font-black text-white"><MessageCircle size={18} /> Chat</button>
                </div>
              </div>
            </motion.article>
          );
        })}
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
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center overflow-x-hidden">
              <motion.div
                initial={{ y: 340 }}
                animate={{ y: 0 }}
                exit={{ y: 340 }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="w-[min(100vw,430px)] max-w-full max-[430px]:rounded-none rounded-t-[32px] bg-white p-6 shadow-2xl max-h-[100dvh] overflow-y-auto overflow-x-hidden"
              >
              <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-zinc-200" />
              <h2 className="text-2xl font-black">Filters</h2>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["all", "All"],
                  ["partner", "Partners"],
                  ["bot", "Friend Hub"]
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
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
