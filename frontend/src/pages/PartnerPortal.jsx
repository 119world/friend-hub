import { ArrowLeft, ImagePlus, Loader2, LogOut, Save, Settings2, Upload, UserRound, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function toList(value, limit) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, limit);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildForm(profile) {
  return {
    name: profile?.name || "Partner",
    age: String(profile?.age || 24),
    gender: profile?.gender || "Woman",
    city: profile?.city || "India",
    location: profile?.location || profile?.city || "India",
    profession: profile?.profession || "Friend Hub Partner",
    bio: profile?.bio || "",
    interests: toList(profile?.interests, 20).join(", "),
    welcomeMessage: profile?.welcomeMessage || "Hey! Thanks for connecting.",
    firstReply: profile?.firstReply || "Nice to meet you.",
    secondReply: profile?.secondReply || "Recharge to continue chatting.",
    freeReplyLimit: String(profile?.freeReplyLimit ?? 1),
    delayMs: String(profile?.delayMs ?? 650),
    chatPrice: String(profile?.chatPrice ?? 9),
    voiceCallPrice: String(profile?.voiceCallPrice ?? 19),
    photos: toList(profile?.photos, 10),
    videos: toList(profile?.videos, 3)
  };
}

export default function PartnerPortal() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("friendHubPartnerSession") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [credBusy, setCredBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(buildForm({}));
  const [cred, setCred] = useState({ loginId: "", oldPassword: "", newPassword: "" });

  const partnerToken = session?.token || "";
  const headers = useMemo(() => ({ "x-partner-token": partnerToken }), [partnerToken]);

  useEffect(() => {
    let live = true;
    async function loadMe() {
      if (!partnerToken) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/partner/me", { headers });
        if (!live) return;
        setForm(buildForm(data.profile || {}));
        setCred((prev) => ({ ...prev, loginId: data.account?.loginId || data.session?.loginId || "" }));
      } catch (err) {
        if (!live) return;
        setError(err.response?.data?.message || "Partner session expired. Please login again.");
      } finally {
        if (live) setLoading(false);
      }
    }
    loadMe();
    return () => {
      live = false;
    };
  }, [headers, navigate, partnerToken]);

  function update(key, value) {
    setSuccess("");
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function removeMedia(kind, index) {
    const limit = kind === "photos" ? 10 : 3;
    const next = toList(form[kind], limit).filter((_, idx) => idx !== index);
    update(kind, next);
  }

  async function uploadFiles(kind, fileList) {
    if (!fileList?.length) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const limit = kind === "photos" ? 10 : 3;
    try {
      const urls = [];
      const existing = toList(form[kind], limit);
      for (const file of Array.from(fileList)) {
        if (existing.length + urls.length >= limit) break;
        const base64 = await fileToBase64(file);
        const payload = {
          base64,
          contentType: file.type,
          fileName: file.name,
          folder: `partners/${session?.partnerId || "partner"}/${kind}`,
          purpose: kind === "photos" ? "partner_photo" : "partner_video"
        };
        const { data } = await api.post("/media/partner-upload", payload, { headers });
        if (data?.item?.url) urls.push(data.item.url);
      }
      update(kind, [...existing, ...urls].slice(0, limit));
      if (urls.length) setSuccess(`${urls.length} ${kind} uploaded.`);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to upload ${kind}.`);
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        city: form.city.trim(),
        location: form.location.trim(),
        profession: form.profession.trim(),
        bio: form.bio.trim(),
        interests: toList(form.interests, 20),
        welcomeMessage: form.welcomeMessage.trim(),
        firstReply: form.firstReply.trim(),
        secondReply: form.secondReply.trim(),
        freeReplyLimit: Number(form.freeReplyLimit),
        delayMs: Number(form.delayMs),
        chatPrice: Number(form.chatPrice),
        voiceCallPrice: Number(form.voiceCallPrice),
        photos: toList(form.photos, 10),
        videos: toList(form.videos, 3)
      };
      const { data } = await api.patch("/partner/profile", payload, { headers });
      setForm(buildForm(data.profile || payload));
      setSuccess("Profile updated. Live users now see your latest profile.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCredential() {
    if (!cred.loginId.trim() || !cred.oldPassword || !cred.newPassword) {
      setError("Login ID, current password, and new password are required.");
      return;
    }
    setCredBusy(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.patch("/partner/credentials", {
        loginId: cred.loginId.trim(),
        oldPassword: cred.oldPassword,
        newPassword: cred.newPassword
      }, { headers });
      const nextSession = {
        ...(session || {}),
        token: data.token || session?.token,
        loginId: data.account?.loginId || cred.loginId.trim()
      };
      localStorage.setItem("friendHubPartnerSession", JSON.stringify(nextSession));
      setSession(nextSession);
      setCred((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
      setSuccess("Login ID/password updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Credential update failed.");
    } finally {
      setCredBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("friendHubPartnerSession");
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-lg font-black text-zinc-700">
          <Loader2 className="animate-spin" size={22} /> Loading partner studio...
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen px-5 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-full bg-zinc-100 p-3"><ArrowLeft size={21} /></button>
        <h1 className="text-3xl font-black">Partner Studio</h1>
        <button onClick={signOut} className="rounded-full bg-zinc-100 p-3"><LogOut size={21} /></button>
      </header>

      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-soft">
        <p className="text-sm font-black text-[#f72565]">Logged in</p>
        <h2 className="mt-1 text-4xl font-black">{session?.loginId || "partner"}</h2>
        <p className="mt-2 text-sm font-semibold text-zinc-500">Partner ID: {session?.partnerId || "partner"}</p>
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
      {success && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</p>}

      <section className="mt-5 space-y-4">
        <article className="rounded-[24px] bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="text-[#f72565]" size={21} />
            <h3 className="text-xl font-black">Profile Basics</h3>
          </div>
          <div className="grid gap-3">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Display name" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.age} onChange={(e) => update("age", e.target.value)} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Age" />
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none">
                <option>Woman</option>
                <option>Man</option>
                <option>Other</option>
              </select>
            </div>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="City" />
            <input value={form.location} onChange={(e) => update("location", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Location" />
            <input value={form.profession} onChange={(e) => update("profession", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Profession" />
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Bio" />
            <input value={form.interests} onChange={(e) => update("interests", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Interests (comma separated)" />
          </div>
        </article>

        <article className="rounded-[24px] bg-[#fff0f5] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImagePlus className="text-[#f72565]" size={21} />
              <h3 className="text-xl font-black">Photos (up to 10)</h3>
            </div>
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-black text-[#f72565]">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles("photos", e.target.files)} />
              <span className="inline-flex items-center gap-2"><Upload size={16} /> Upload</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {toList(form.photos, 10).map((url, index) => (
              <div key={`${url}_${index}`} className="relative overflow-hidden rounded-xl bg-white">
                <img src={url} alt="" className="h-20 w-full object-cover" />
                <button onClick={() => removeMedia("photos", index)} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"><X size={12} /></button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] bg-zinc-100 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="text-zinc-700" size={21} />
              <h3 className="text-xl font-black">Videos (up to 3)</h3>
            </div>
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-700">
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => uploadFiles("videos", e.target.files)} />
              <span className="inline-flex items-center gap-2"><Upload size={16} /> Upload</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {toList(form.videos, 3).map((url, index) => (
              <div key={`${url}_${index}`} className="relative overflow-hidden rounded-xl bg-white">
                <video src={url} className="h-28 w-full object-cover" muted loop playsInline autoPlay />
                <button onClick={() => removeMedia("videos", index)} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"><X size={12} /></button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Settings2 className="text-[#f72565]" size={21} />
            <h3 className="text-xl font-black">Auto Reply & Rates</h3>
          </div>
          <div className="grid gap-3">
            <input value={form.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Welcome message" />
            <input value={form.firstReply} onChange={(e) => update("firstReply", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="First reply" />
            <input value={form.secondReply} onChange={(e) => update("secondReply", e.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Second reply / recharge message" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.freeReplyLimit} onChange={(e) => update("freeReplyLimit", e.target.value)} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Free reply limit" />
              <input value={form.delayMs} onChange={(e) => update("delayMs", e.target.value)} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Delay ms" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.chatPrice} onChange={(e) => update("chatPrice", e.target.value)} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Chat price" />
              <input value={form.voiceCallPrice} onChange={(e) => update("voiceCallPrice", e.target.value)} inputMode="numeric" className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Call price" />
            </div>
          </div>
        </article>

        <article className="rounded-[24px] bg-white p-5 shadow-soft">
          <h3 className="mb-3 text-xl font-black">Change Login</h3>
          <div className="grid gap-3">
            <input value={cred.loginId} onChange={(e) => setCred((prev) => ({ ...prev, loginId: e.target.value }))} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" placeholder="New login ID" />
            <input value={cred.oldPassword} onChange={(e) => setCred((prev) => ({ ...prev, oldPassword: e.target.value }))} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" type="password" placeholder="Current password" />
            <input value={cred.newPassword} onChange={(e) => setCred((prev) => ({ ...prev, newPassword: e.target.value }))} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none" type="password" placeholder="New password (min 6 chars)" />
            <button disabled={credBusy} onClick={saveCredential} className="rounded-full border border-[#f72565] py-3 text-sm font-black text-[#f72565] disabled:opacity-60">
              {credBusy ? "Updating..." : "Update ID / Password"}
            </button>
          </div>
        </article>

        <button disabled={saving || uploading} onClick={saveProfile} className="pink-gradient flex w-full items-center justify-center gap-2 rounded-full py-3 font-black text-white disabled:opacity-60">
          {(saving || uploading) ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {uploading ? "Uploading..." : saving ? "Saving..." : "Save Partner Profile"}
        </button>
      </section>
    </main>
  );
}
