import { doc, setDoc } from "firebase/firestore";
import { ArrowLeft, Briefcase, Edit3, MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "Meera",
    age: profile?.age || 25,
    gender: profile?.gender || "Woman",
    city: profile?.city || "Bangalore, India",
    profession: profile?.profession || "Product Designer",
    bio: profile?.bio || "Love to travel, explore new cafes, and capture moments. Looking for someone who is kind, honest and fun to be with.",
    lookingFor: profile?.lookingFor || "Long-term relationship",
    interests: (profile?.interests || ["Travel", "Photography", "Coffee", "Music", "Hiking", "Movies"]).join(", "),
    photo: profile?.photos?.[0] || "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=88"
  });

  async function save() {
    const payload = {
      ...form,
      age: Number(form.age),
      photos: [form.photo],
      interests: form.interests.split(",").map((x) => x.trim()).filter(Boolean)
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

  const interests = form.interests.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <section className="phone-page px-6">
      <header className="grid grid-cols-3 items-center pb-6 pt-2">
        <button onClick={() => navigate(-1)} className="justify-self-start"><ArrowLeft size={31} /></button>
        <h1 className="justify-self-center text-[23px] font-black">Profile</h1>
        <button onClick={() => setEditing((value) => !value)} className="justify-self-end"><Edit3 size={28} /></button>
      </header>

      {editing ? (
        <div className="space-y-3 rounded-[28px] bg-white">
          {["name", "age", "gender", "city", "profession", "photo", "lookingFor", "interests"].map((key) => (
            <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={key} className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          ))}
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows="4" className="w-full rounded-2xl bg-zinc-100 px-5 py-4 outline-none" />
          <button onClick={save} className="pink-gradient w-full rounded-full py-4 font-black text-white">Save Profile</button>
          <button onClick={logout} className="w-full rounded-full bg-zinc-100 py-4 font-black text-zinc-700">Logout</button>
        </div>
      ) : (
        <>
          <div className="relative h-[300px] overflow-hidden rounded-[24px]">
            <img src={form.photo} className="h-full w-full object-cover" />
            <span className="absolute bottom-5 left-5 grid h-11 w-11 place-items-center rounded-full bg-blue-500 text-2xl font-black text-white">✓</span>
          </div>
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
            <p className="mt-4 text-[19px] font-medium leading-8 text-zinc-700">{form.bio} 💕</p>
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
            <p className="mt-4 text-[19px] font-medium text-zinc-600">{form.lookingFor} 💗</p>
          </section>
        </>
      )}
    </section>
  );
}
