import { CheckCircle2, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileCard({ profile, onChat, onVoice }) {
  const photo = profile.photos?.[0] || profile.galleryPhotos?.[0] || "";
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-soft"
    >
      {photo ? <img className="h-80 w-full object-cover" src={photo} alt={profile.name} /> : <div className="skeleton h-80 w-full" />}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{profile.name}, {profile.age}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={15} /> {profile.city || profile.location || "Nearby"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> Verified
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star size={16} fill="currentColor" /> {profile.rating || 4.8}
            </span>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">{profile.bio || profile.welcomeMessage}</p>
        <div className="flex flex-wrap gap-2">
          {(profile.interests || []).slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-blush px-3 py-1 text-xs font-medium text-roseDeep">{tag}</span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={onChat} className="rounded-xl bg-roseSoft px-4 py-3 font-semibold text-white shadow-soft">Chat</button>
          <button onClick={onVoice} className="rounded-xl border border-pink-200 bg-white px-4 py-3 font-semibold text-roseDeep">Voice</button>
        </div>
      </div>
    </motion.article>
  );
}
