import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { openChat } from "../services/chatService";
import { sampleThreads } from "../utils/sampleData";

function AvatarMedia({ item, className = "" }) {
  const photo = item.photo || item.photos?.[0] || item.targetPhoto;
  const video = !photo ? item.videos?.[0] : "";
  if (video) return <video src={video} muted loop playsInline autoPlay className={`object-cover ${className}`} />;
  return <img src={photo} className={`object-cover ${className}`} />;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => listenPublicProfiles(setProfiles), []);

  const threads = useMemo(() => {
    if (profiles.length) {
      return profiles
        .filter((item) => item.showInMatches !== false)
        .slice(0, 12)
        .map((item) => ({
          id: `thread_${item.id}`,
          name: item.name,
          preview: item.type === "bot" ? (item.welcomeMessage || "Friend Hub message") : (item.bio || "Say hello and start chatting"),
          time: item.online === false ? "Offline" : "Online",
          unread: item.allowAutoContact === false ? 0 : 1,
          target: item,
          photos: item.photos,
          videos: item.videos
        }));
    }
    return sampleThreads;
  }, [profiles]);

  async function openThread(thread) {
    if (thread.target) {
      const chatId = await openChat({ user, target: thread.target });
      navigate(`/chat/${chatId}`);
      return;
    }
    navigate(`/chat/${thread.id}`);
  }

  return (
    <section className="phone-page px-6">
      <PhoneStatusBar />
      <header className="pb-7 pt-7 text-center">
        <h1 className="text-[25px] font-black">Messages</h1>
      </header>

      <label className="flex h-[58px] items-center gap-3 rounded-full bg-zinc-100 px-5 text-zinc-400">
        <Search size={25} />
        <input className="w-full bg-transparent text-[18px] outline-none placeholder:text-zinc-400" placeholder="Search messages" />
      </label>

      <section className="mt-8 pb-6">
        <div className="divide-y divide-zinc-100">
          {threads.map((thread) => (
            <button key={thread.id} onClick={() => openThread(thread)} className="flex w-full items-center gap-4 py-5 text-left">
              <div className="relative h-[70px] w-[70px] shrink-0 rounded-full bg-[#f72565] p-[2px]">
                <AvatarMedia item={thread} className="h-full w-full rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[21px] font-black">{thread.name}</h3>
                <p className="mt-1 truncate text-base font-medium text-zinc-500">{thread.preview}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-500">{thread.time}</p>
                {thread.unread > 0 && <span className="mt-3 inline-grid h-7 min-w-7 place-items-center rounded-full bg-[#f72565] px-2 text-sm font-black text-white">{thread.unread}</span>}
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
