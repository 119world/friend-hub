import { Link } from "react-router-dom";
import { BadgeCheck, Heart, MessageCircle, Sparkles, UsersRound, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { listenPublicProfiles } from "../services/appConfig";
import { sampleProfiles } from "../utils/sampleData";

function Brand() {
  return (
    <span className="font-black text-[#11162e]">
      Friend <span className="text-[#f72565]">Hub</span>
    </span>
  );
}

export default function Home() {
  const { profile } = useAuth();
  const [remoteProfiles, setRemoteProfiles] = useState([]);

  useEffect(() => listenPublicProfiles(setRemoteProfiles), []);

  const profiles = useMemo(() => {
    const source = remoteProfiles.length ? remoteProfiles : sampleProfiles;
    return source.filter((item) => item.active !== false && item.showInDiscovery !== false).slice(0, 6);
  }, [remoteProfiles]);

  return (
    <section className="phone-page px-4 pb-28 pt-4">
      <header className="overflow-hidden rounded-[28px] bg-white shadow-soft">
        <div className="bg-[#fff0f6] px-5 py-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-[#f72565]">
            <Sparkles size={14} /> Friend Hub
          </p>
          <h1 className="mt-4 text-[32px] font-black leading-[1.05] tracking-normal">
            Meet new friends on <Brand />.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
            Discover verified partners, chat safely, and build interest-based friendships in one clean space.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          <Link to="/discovery" className="rounded-2xl bg-[#f72565] p-3 text-center text-white">
            <UsersRound className="mx-auto" size={23} />
            <span className="mt-2 block text-xs font-black">Discover</span>
          </Link>
          <Link to="/messages" className="rounded-2xl bg-zinc-100 p-3 text-center text-zinc-800">
            <MessageCircle className="mx-auto text-[#f72565]" size={23} />
            <span className="mt-2 block text-xs font-black">Chats</span>
          </Link>
          <Link to="/recharge" className="rounded-2xl bg-zinc-100 p-3 text-center text-zinc-800">
            <Wallet className="mx-auto text-[#f72565]" size={23} />
            <span className="mt-2 block text-xs font-black">{profile?.diamonds || 0} Credits</span>
          </Link>
        </div>
      </header>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-[#f72565]">Friend Hub Profiles</p>
            <h2 className="text-2xl font-black leading-tight">Fresh people to discover</h2>
          </div>
          <Link to="/discovery" className="shrink-0 rounded-full bg-[#fff0f6] px-3 py-2 text-xs font-black text-[#f72565]">View all</Link>
        </div>
        <div className="grid gap-3">
          {profiles.map((item) => {
            const photo = item.photos?.[0] || item.galleryPhotos?.[0] || sampleProfiles[0].photos[0];
            return (
              <Link key={item.id} to={`/people/${item.id}`} state={{ profile: item }} className="flex min-w-0 items-center gap-3 rounded-[22px] bg-white p-3 shadow-soft">
                <img src={photo} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-1 text-base font-black">
                    <span className="truncate">{item.name || "Friend Hub Partner"}, {item.age || 24}</span>
                    {item.verified !== false && <BadgeCheck size={17} className="shrink-0 text-blue-500" />}
                  </p>
                  <p className="truncate text-xs font-bold text-zinc-500">{item.profession || item.personality || "Friend Hub Partner"} · {item.location || item.city || "Nearby"}</p>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-zinc-500">{item.bio || "Friendly verified profile on Friend Hub."}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0f6] text-[#f72565]">
                  <Heart size={18} fill="currentColor" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black"><Brand /> keeps it simple</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
          Use Discover for profiles, Messages for conversations, and Recharge only for premium social features like chat boosts and visibility.
        </p>
      </section>
    </section>
  );
}
