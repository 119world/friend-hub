import { doc, setDoc } from "firebase/firestore";
import { ArrowLeft, Briefcase, Check, Edit3, Heart, MapPin, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneStatusBar from "../components/PhoneStatusBar";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

function listToText(value, fallback = []) {
  return (value?.length ? value : fallback).join(", ");
}

function textToList(value, limit) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export default function Profile() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: profile?.name || "Meera",
    age: profile?.age || 25,
    gender: profile?.gender || "Woman",
    city: profile?.city || "Bangalore, India",
    profession: profile?.profession || "Product Designer",
    bio: profile?.bio || "Love to travel, explore new cafes, and capture moments. Looking for someone who is kind, honest and fun to be with.",
    lookingFor: profile?.lookingFor || "Long-term relationship",
    interests: listToText(profile?.interests, ["Travel", "Photography", "Coffee", "Music", "Hiking", "Movies"]),
    photos: listToText(profile?.photos, ["https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=88"]),
    videos: listToText(profile?.videos, [])
  });

  const photos = useMemo(() => textToList(form.photos, 6), [form.photos]);
  const videos = useMemo(() => textToList(form.videos, 2), [form.videos]);
  const interests = useMemo(() => textToList(form.interests, 12), [form.interests]);
  const primaryPhoto = photos[0] || "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=88";

  async function save() {
    setError("");
    if (photos.length > 6 || videos.length > 2) {
      setError("Use up to 6 photos and 2 short videos.");
      return;
    }
    const payload = {
      name: form.name.trim() || "Friend Hub User",
      age: Number(form.age),
      gender: form.gender,
      city: form.city,
      profession: form.profession,
      bio: form.bio,
      lookingFor: form.lookingFor,
      photos,
      videos,
      interests
    };
    if (user?.isLocal) {
      const next = { ...profile, ...payload };
      localStorage.setItem("friendHubLocalProfile", JSON.stringify(next));
    } else {
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    }
    await refreshProfile();
    setEditing(false);
  }

  return (
    <section className="phone-page px-6">
      <PhoneStatusBar />
      <header className="grid grid-cols-3 items-center pb-6 pt-7">
        <button onClick={() => navigate(-1)} className="justify-self-start"><ArrowLeft size={31} /></button>
        <h1 className="justify-self-center text-[23px] font-black">Profile</h1>
        <button onClick={() => setEditing((value) => !value)} className="justify-self-end"><Edit3 size={28} /></button>
      </header>

      {editing ? (
        <div className="space-y-3 rounded-[28px] bg-white">
          {["name", "age", "gender", "city", "profession", "lookingFor", "interests"].map((key) => (
            <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={key} className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          ))}
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows="4" placeholder="Bio" className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          <textarea value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} rows="3" placeholder="Photo URLs, comma separated. 3 to 6 recommended." className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          <textarea value={form.videos} onChange={(e) => setForm({ ...form, videos: e.target.value })} rows="2" placeholder="Short video URLs, comma separated. 1 to 2 optional." className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
          <button onClick={save} className="pink-gradient w-full rounded-full py-4 font-black text-white">Save Profile</button>
          <button onClick={logout} className="w-full rounded-full bg-zinc-100 py-4 font-black text-zinc-700">Logout</button>
        </div>
      ) : (
        <>
          <div className="relative h-[300px] overflow-hidden rounded-[24px]">
            <img src={primaryPhoto} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-5 left-5 grid h-11 w-11 place-items-center rounded-full bg-blue-500 text-white"><Check size={28} strokeWidth={4} /></span>
          </div>
          {photos.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {photos.slice(1).map((photo) => (
                <img key={photo} src={photo} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              ))}
            </div>
          )}
          <section className="pt-6">
            <h2 className="text-[32px] font-black leading-none">{form.name}, {form.age}</h2>
            <p className="mt-5 flex items-center gap-3 text-lg font-medium text-zinc-500"><Briefcase size={23} /> {form.profession}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-lg font-medium text-zinc-500">
              <span className="flex items-center gap-2"><MapPin size={24} /> {form.city}</span>
              <span className="h-6 w-px bg-zinc-300" />
              <span className="flex items-center gap-2"><UserRound size={23} /> {form.gender}</span>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-xl font-black">About Me</h3>
            <p className="mt-4 text-[19px] font-medium leading-8 text-zinc-700">{form.bio}</p>
          </section>

          <section className="mt-8">
            <h3 className="text-xl font-black">Interests</h3>
            <div className="mt-4 flex flex-wrap gap-4">
              {interests.map((item) => (
                <span key={item} className="rounded-full bg-[#ffeaf1] px-6 py-3 text-base font-black text-[#d73568]">{item}</span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-xl font-black">Looking For</h3>
            <p className="mt-4 flex items-center gap-2 text-[19px] font-medium text-zinc-600">
              {form.lookingFor}
              <Heart size={20} fill="#f72565" strokeWidth={0} className="text-[#f72565]" />
            </p>
          </section>

          <section className="mt-8 rounded-[24px] bg-[#fff0f5] p-5">
            <h3 className="text-xl font-black">Referral Bonus</h3>
            <p className="mt-2 text-sm font-semibold text-zinc-600">Code: <span className="font-black text-[#f72565]">{profile?.referralCode || "FRIENDHUB"}</span></p>
            <p className="mt-2 text-sm font-semibold text-zinc-600">{Number(profile?.referralCount || 0)} referrals joined. Bonus unlocks from 5 referrals, then 10 and admin-set milestones.</p>
          </section>
        </>
      )}
    </section>
  );
}
