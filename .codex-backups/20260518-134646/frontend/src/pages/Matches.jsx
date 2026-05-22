import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { sampleProfiles, sampleThreads } from "../utils/sampleData";

export default function Matches({ mode = "matches" }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!user || user.isLocal) return undefined;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => setChats(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), () => {});
  }, [user]);

  const threads = useMemo(() => {
    if (!chats.length) return sampleThreads;
    return chats.map((chat) => ({
      id: chat.id,
      name: chat.targetName || "Friend",
      photo: chat.targetPhoto || sampleProfiles[0].photos[0],
      preview: chat.targetType === "bot" ? "AI Bot chat" : "Verified partner chat",
      time: "Now",
      unread: chat.unreadByUser || 0
    }));
  }, [chats]);

  return (
    <section className="phone-page px-6">
      <header className="pb-7 pt-3 text-center">
        <h1 className="text-[23px] font-black">{mode === "likes" ? "Likes" : mode === "messages" ? "Messages" : "Matches"}</h1>
      </header>

      <label className="flex h-[54px] items-center gap-3 rounded-full bg-zinc-100 px-5 text-zinc-400">
        <Search size={24} />
        <input className="w-full bg-transparent text-lg outline-none placeholder:text-zinc-400" placeholder="Search matches" />
      </label>

      <section className="mt-8">
        <h2 className="text-[22px] font-black">New Matches</h2>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-2">
          <Link to="/likes" className="shrink-0 text-center">
            <div className="relative h-[74px] w-[74px] rounded-full bg-gradient-to-br from-amber-400 to-[#f72565] p-[3px]">
              <img src={sampleProfiles[0].photos[0]} className="h-full w-full rounded-full border-2 border-white object-cover" />
              <span className="absolute -right-2 top-0 rounded-full bg-[#f72565] px-2 py-1 text-xs font-black text-white">99+</span>
              <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#f72565]" />
            </div>
            <span className="mt-2 block text-sm font-bold">Likes</span>
          </Link>
          {sampleProfiles.slice(1, 4).map((item) => (
            <Link key={item.id} to={`/chat/local_${item.id}`} className="shrink-0 text-center">
              <div className="relative h-[74px] w-[74px] rounded-full bg-[#f72565] p-[3px]">
                <img src={item.photos[0]} className="h-full w-full rounded-full border-2 border-white object-cover" />
                <span className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#f72565]" />
              </div>
              <span className="mt-2 block text-sm font-bold">{item.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[22px] font-black">Messages</h2>
        <div className="mt-5 divide-y divide-zinc-100">
          {threads.map((thread) => (
            <Link key={thread.id} to={`/chat/${thread.id}`} className="flex items-center gap-4 py-4">
              <div className="relative h-[68px] w-[68px] shrink-0 rounded-full bg-[#f72565] p-[2px]">
                <img src={thread.photo} className="h-full w-full rounded-full border-2 border-white object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black">{thread.name}</h3>
                <p className="mt-1 truncate text-base font-medium text-zinc-500">{thread.preview}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-500">{thread.time}</p>
                {thread.unread > 0 && <span className="mt-3 inline-grid h-7 min-w-7 place-items-center rounded-full bg-[#f72565] px-2 text-sm font-black text-white">{thread.unread}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
