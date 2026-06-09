import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { usePublicProfiles } from "../hooks/usePublicProfiles";
import { openChat } from "../services/chatService";

const useFirestore = import.meta.env.VITE_USE_FIRESTORE !== "false";

function AvatarMedia({ item, className = "" }) {
  const photo = item.photo || item.photos?.[0] || item.targetPhoto;
  const video = !photo ? item.videos?.[0] : "";
  if (video) return <video src={video} muted loop playsInline autoPlay className={`object-cover ${className}`} />;
  return photo ? <img src={photo} className={`object-cover ${className}`} /> : <div className={`skeleton ${className}`} />;
}

function AvatarSkeleton() {
  return (
    <div className="w-[76px] flex-none text-center min-[390px]:w-[82px]">
      <div className="skeleton mx-auto h-[68px] w-[68px] rounded-full min-[390px]:h-[76px] min-[390px]:w-[76px]" />
      <div className="skeleton mx-auto mt-2 h-3 w-12 rounded-full" />
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex items-center gap-4 py-5">
      <div className="skeleton h-[70px] w-[70px] shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="skeleton h-5 w-2/5 rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

export default function Matches({ mode = "matches" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const { profiles, isInitialLoading, error, isOffline } = usePublicProfiles();

  useEffect(() => {
    if (!useFirestore || !user || user.isLocal) return undefined;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => setChats(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), () => {});
  }, [user]);

  const threads = useMemo(() => {
    if (!chats.length) {
      const adminMatches = Array.isArray(profiles) ? profiles.filter((item) => item.showInMatches !== false) : [];
      if (adminMatches.length) {
        return adminMatches.map((item) => ({
          id: `local_${item.id}`,
          name: item.name,
          photo: item.photos?.[0] || "",
          videos: item.videos || [],
          preview: item.type === "bot" ? (item.welcomeMessage || "Friend Hub is online") : (item.bio || "Verified community profile is online"),
          time: item.online === false ? "Offline" : "Online",
          unread: item.allowAutoContact === false ? 0 : 1,
          target: item
        }));
      }
      return [];
    }
    return chats.map((chat) => ({
      id: chat.id,
      name: chat.targetName || "Friend",
      photo: chat.targetPhoto || "",
      preview: chat.targetType === "bot" ? "Friend Hub chat" : "Verified community chat",
      time: "Now",
      unread: chat.unreadByUser || 0
    }));
  }, [chats, profiles]);

  const newMatches = useMemo(() => {
    const adminMatches = Array.isArray(profiles) ? profiles.filter((item) => item.showInMatches !== false) : [];
    return adminMatches;
  }, [profiles]);

  async function openTarget(target) {
    const chatId = await openChat({ user, target });
    navigate(`/chat/${chatId}`);
  }

  async function openThread(thread) {
    if (thread.target) return openTarget(thread.target);
    navigate(`/chat/${thread.id}`);
  }

  return (
    <section className="phone-page px-6">
      <PhoneStatusBar />
      <header className="pb-7 pt-7 text-center">
        <h1 className="text-[25px] font-black">{mode === "likes" ? "Likes" : mode === "messages" ? "Messages" : "Connections"}</h1>
      </header>

      <label className="flex h-[58px] items-center gap-3 rounded-full bg-zinc-100 px-5 text-zinc-400">
        <Search size={25} />
        <input className="w-full bg-transparent text-[18px] outline-none placeholder:text-zinc-400" placeholder="Search connections" />
      </label>

      <section className="mt-8">
        <h2 className="text-[23px] font-black">New Connections</h2>
        <div className="-mx-6 mt-5 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-3 hide-scrollbar">
          <div className="flex w-max flex-nowrap items-start gap-4">
            <Link to="/likes" className="w-[76px] flex-none text-center min-[390px]:w-[82px]" aria-label="Open likes">
              <div className="relative mx-auto h-[68px] w-[68px] rounded-full bg-gradient-to-br from-amber-400 to-[#f72565] p-[3px] min-[390px]:h-[76px] min-[390px]:w-[76px]">
                <div className="grid h-full w-full place-items-center rounded-full border-2 border-white bg-white text-xl font-black text-[#f72565]">+</div>
                <span className="absolute -right-2 top-0 rounded-full bg-[#f72565] px-2 py-1 text-xs font-black text-white">99+</span>
                <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#f72565]" />
              </div>
              <span className="mt-2 block text-sm font-bold">Likes</span>
            </Link>
            {isInitialLoading && [0, 1, 2].map((item) => <AvatarSkeleton key={item} />)}
            {newMatches.map((item) => (
              <button key={item.id} onClick={() => openTarget(item)} className="w-[76px] flex-none text-center min-[390px]:w-[82px]" aria-label={`Open ${item.name}`}>
                <div className="relative mx-auto h-[68px] w-[68px] rounded-full bg-[#f72565] p-[3px] min-[390px]:h-[76px] min-[390px]:w-[76px]">
                  <AvatarMedia item={item} className="h-full w-full rounded-full border-2 border-white" />
                  <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#f72565]" />
                </div>
                <span className="mt-2 block truncate text-sm font-bold">{item.name}</span>
              </button>
            ))}
            {!isInitialLoading && !newMatches.length && (
              <div className="w-[180px] flex-none rounded-2xl bg-zinc-50 px-4 py-5 text-left">
                <p className="text-sm font-black text-zinc-700">No new profiles</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">{error ? (isOffline ? "Offline hai." : "Profiles retry ho raha hai.") : "Admin se partner add karo."}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[23px] font-black">Messages</h2>
        <div className="mt-5 divide-y divide-zinc-100">
          {isInitialLoading && [0, 1, 2].map((item) => <ThreadSkeleton key={item} />)}
          {!isInitialLoading && !threads.length && (
            <div className="rounded-3xl bg-zinc-50 px-5 py-8 text-center">
              <p className="text-base font-black text-zinc-700">No messages yet</p>
              <p className="mt-1 text-sm font-semibold text-zinc-500">New partner profiles add hote hi yahan conversations dikhengi.</p>
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
