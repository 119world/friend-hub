import { Search } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { useAuth } from "../hooks/useAuth";
import { usePublicProfiles } from "../hooks/usePublicProfiles";
import { openChat } from "../services/chatService";

function AvatarMedia({ item, className = "" }) {
  const photo = item.photo || item.photos?.[0] || item.targetPhoto;
  const video = !photo ? item.videos?.[0] : "";
  if (video) return <video src={video} muted loop playsInline autoPlay className={`object-cover ${className}`} />;
  return photo ? <img src={photo} className={`object-cover ${className}`} /> : <div className={`skeleton ${className}`} />;
}

function ThreadSkeleton() {
  return (
    <div className="flex items-center gap-4 py-5">
      <div className="skeleton h-[70px] w-[70px] shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="skeleton h-5 w-2/5 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
      </div>
      <div className="skeleton h-4 w-12 rounded-full" />
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profiles, isInitialLoading, error, isOffline } = usePublicProfiles();

  const threads = useMemo(() => {
    if (profiles.length) {
      return profiles
        .filter((item) => item.showInMatches !== false)
        .slice(0, 12)
        .map((item) => ({
          id: `thread_${item.id}`,
          name: item.name,
          preview: item.bio || "Say hello and start chatting",
          time: item.online === false ? "Offline" : "Online",
          unread: item.allowAutoContact === false ? 0 : 1,
          target: item,
          photos: item.photos,
          videos: item.videos
        }));
    }
    return [];
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
          {isInitialLoading && [0, 1, 2, 3].map((item) => <ThreadSkeleton key={item} />)}
          {!isInitialLoading && !threads.length && (
            <div className="rounded-3xl bg-zinc-50 px-5 py-8 text-center">
              <p className="text-base font-black text-zinc-700">No messages yet</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {error ? (isOffline ? "Offline hai. Cached profiles available honge to messages yahan dikhengi." : "Profiles refresh retry ho raha hai.") : "Admin se partner profile add karne ke baad chats yahan show hongi."}
              </p>
            </div>
          )}
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
