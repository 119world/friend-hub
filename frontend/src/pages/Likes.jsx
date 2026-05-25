import { Heart, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { openChat } from "../services/chatService";
import { sampleProfiles } from "../utils/sampleData";

function AvatarMedia({ item, className = "" }) {
  const photo = item.photos?.[0] || item.photo;
  const video = !photo ? item.videos?.[0] : "";
  if (video) return <video src={video} muted loop playsInline autoPlay className={`object-cover ${className}`} />;
  return <img src={photo || sampleProfiles[0].photos[0]} className={`object-cover ${className}`} />;
}

export default function Likes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => listenPublicProfiles(setProfiles), []);

  const likedProfiles = useMemo(() => {
    const source = profiles.filter((item) => item.showInDiscovery !== false);
    return (source.length ? source : sampleProfiles).slice(0, 12);
  }, [profiles]);

  async function openLikedProfile(target) {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  return (
    <section className="phone-page px-6">
      <PhoneStatusBar />
      <header className="pb-7 pt-7 text-center">
        <h1 className="text-[25px] font-black">Likes</h1>
        <p className="mt-1 text-sm font-medium text-zinc-500">People interested in connecting with you</p>
      </header>

      <section className="grid grid-cols-2 gap-4 pb-6">
        {likedProfiles.map((item) => (
          <button
            key={item.id}
            onClick={() => openLikedProfile(item)}
            className="rounded-[24px] border border-zinc-100 bg-white p-3 text-left shadow-sm"
          >
            <div className="relative overflow-hidden rounded-[18px]">
              <AvatarMedia item={item} className="h-40 w-full" />
              <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#f72565] text-white">
                <Heart size={14} fill="currentColor" />
              </span>
            </div>
            <h3 className="mt-3 text-lg font-black">{item.name}, {item.age}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <MapPin size={14} /> {item.city || item.location || "India"}
            </p>
          </button>
        ))}
      </section>
    </section>
  );
}
