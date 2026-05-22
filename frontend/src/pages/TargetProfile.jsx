import { ArrowLeft, Briefcase, Check, Heart, Lock, MapPin, MessageCircle, Phone, Play, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { openChat } from "../services/chatService";
import { sampleProfiles } from "../utils/sampleData";

export default function TargetProfile() {
  const { targetId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const hasPremium = Number(myProfile?.diamonds || 0) > 0 || myProfile?.premium === true;

  useEffect(() => listenPublicProfiles(setProfiles), []);

  const target = useMemo(() => {
    return state?.profile ||
      profiles.find((item) => item.id === targetId) ||
      sampleProfiles.find((item) => item.id === targetId) ||
      sampleProfiles[0];
  }, [profiles, state?.profile, targetId]);

  const photos = target.photos?.length ? target.photos.slice(0, 7) : [sampleProfiles[0].photos[0]];
  const videos = target.videos?.length ? target.videos.slice(0, 3) : [];

  async function startChat() {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  function startCall(mode) {
    if (!hasPremium) {
      navigate("/recharge", { state: { reason: `Recharge diamonds to start a ${mode} call with ${target.name}.` } });
      return;
    }
    navigate(`/chat/local_${target.id}`, { state: { callMode: mode } });
  }

  return (
    <section className="phone-page px-6 pb-8">
      <header className="grid grid-cols-3 items-center pb-5 pt-6">
        <button onClick={() => navigate(-1)} className="justify-self-start"><ArrowLeft size={30} /></button>
        <h1 className="justify-self-center text-[22px] font-black">Profile</h1>
        <span />
      </header>

      <div className="relative h-[390px] overflow-hidden rounded-[28px] bg-zinc-100">
        <img src={photos[0]} alt={target.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent p-5 text-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[34px] font-black leading-none">{target.name}, {target.age}</h2>
            {target.verified !== false && <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500"><Check size={22} strokeWidth={4} /></span>}
          </div>
          <p className="mt-4 flex items-center gap-2 text-lg font-bold"><Briefcase size={21} /> {target.profession || target.personality || "Friend Hub Partner"}</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-bold"><MapPin size={22} /> {target.location || target.city || "Nearby"}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {photos.slice(1).map((photo) => (
          <img key={photo} src={photo} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
        ))}
      </div>

      <section className="mt-6">
        <h3 className="text-xl font-black">About</h3>
        <p className="mt-3 text-lg font-medium leading-8 text-zinc-700">{target.bio || "Verified profile for friendly chat and calls."}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(target.interests || []).slice(0, 8).map((item) => (
            <span key={item} className="rounded-full bg-[#ffeaf1] px-4 py-2 text-sm font-black text-[#d73568]">{item}</span>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="text-xl font-black">Videos</h3>
        <div className="mt-3 grid gap-3">
          {videos.length ? videos.map((video) => (
            <div key={video} className="relative overflow-hidden rounded-[22px] bg-zinc-100">
              {hasPremium ? (
                <video src={video} controls playsInline className="max-h-72 w-full bg-black object-cover" />
              ) : (
                <div className="grid h-40 place-items-center bg-zinc-950 text-center text-white">
                  <Lock size={30} />
                  <p className="mt-2 text-sm font-black">Premium video locked</p>
                </div>
              )}
            </div>
          )) : (
            <div className="grid h-32 place-items-center rounded-[22px] bg-zinc-100 text-zinc-500">
              <Play size={28} />
            </div>
          )}
        </div>
      </section>

      <div className="mt-7 grid grid-cols-3 gap-3">
        <button onClick={startChat} className="pink-gradient flex items-center justify-center gap-2 rounded-full py-4 font-black text-white"><MessageCircle size={19} /> Chat</button>
        <button onClick={() => startCall("audio")} className="flex items-center justify-center gap-2 rounded-full bg-zinc-100 py-4 font-black text-zinc-700"><Phone size={19} /> Audio</button>
        <button onClick={() => startCall("video")} className="flex items-center justify-center gap-2 rounded-full bg-zinc-100 py-4 font-black text-zinc-700"><Video size={19} /> Video</button>
      </div>

      {!hasPremium && (
        <button onClick={() => navigate("/recharge")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] py-4 font-black text-[#f72565]">
          <Heart size={18} fill="currentColor" /> Unlock videos and calls
        </button>
      )}
    </section>
  );
}
