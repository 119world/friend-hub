import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  LogOut,
  Plus,
  Save,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  UserRound,
  Video,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MAX_PHOTOS = 7;
const MAX_VIDEOS = 2;

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

function buildForm(profile = {}) {
  return {
    id: profile.id || "",
    name: profile.name || "Partner",
    age: String(profile.age || 24),
    gender: profile.gender || "Woman",
    city: profile.city || "India",
    location: profile.location || profile.city || "India",
    profession: profile.profession || "Friend Hub Partner",
    phone: profile.phone || "",
    category: profile.category || "community",
    bio: profile.bio || "",
    interests: toList(profile.interests, 20).join(", "),
    welcomeMessage: profile.welcomeMessage || "Hey! Thanks for connecting.",
    firstReply: profile.firstReply || "Nice to meet you.",
    secondReply: profile.secondReply || "Recharge to continue chatting.",
    freeReplyLimit: String(profile.freeReplyLimit ?? 1),
    delayMs: String(profile.delayMs ?? 650),
    chatPrice: String(profile.chatPrice ?? 9),
    voiceCallPrice: String(profile.voiceCallPrice ?? 19),
    photos: toList(profile.photos || profile.galleryPhotos, MAX_PHOTOS),
    videos: toList(profile.videos, MAX_VIDEOS),
    active: profile.active !== false,
    loginId: profile.account?.loginId || ""
  };
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    age: Number(form.age),
    gender: form.gender,
    city: form.city.trim(),
    location: form.location.trim(),
    profession: form.profession.trim(),
    phone: form.phone.trim(),
    category: form.category.trim(),
    bio: form.bio.trim(),
    interests: toList(form.interests, 20),
    welcomeMessage: form.welcomeMessage.trim(),
    firstReply: form.firstReply.trim(),
    secondReply: form.secondReply.trim(),
    freeReplyLimit: Number(form.freeReplyLimit),
    delayMs: Number(form.delayMs),
    chatPrice: Number(form.chatPrice),
    voiceCallPrice: Number(form.voiceCallPrice),
    photos: toList(form.photos, MAX_PHOTOS),
    galleryPhotos: toList(form.photos, MAX_PHOTOS),
    videos: toList(form.videos, MAX_VIDEOS),
    active: form.active !== false,
    loginId: form.loginId.trim()
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
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(buildForm({}));
  const [createForm, setCreateForm] = useState({
    name: "",
    loginId: "",
    password: "",
    phone: ""
  });

  const partnerToken = session?.token || "";
  const headers = useMemo(() => ({ "x-partner-token": partnerToken }), [partnerToken]);
  const canManageAll = Boolean(session?.canManageAll || session?.role === "main_partner");
  const selectedProfile = profiles.find((item) => item.id === form.id) || null;

  useEffect(() => {
    let live = true;
    async function loadPortal() {
      if (!partnerToken) {
        navigate("/login", { replace: true });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const meRes = await api.get("/partner/me", { headers });
        const serverSession = meRes.data?.session || {};
        const meProfile = meRes.data?.profile || {};
        const mergedSession = {
          ...(session || {}),
          partnerId: serverSession.partnerId || session?.partnerId,
          accountId: serverSession.accountId || session?.accountId,
          role: serverSession.role || session?.role,
          canManageAll: Boolean(serverSession.canManageAll || session?.canManageAll),
          loginId: serverSession.loginId || session?.loginId
        };
        localStorage.setItem("friendHubPartnerSession", JSON.stringify(mergedSession));
        if (!live) return;
        setSession(mergedSession);

        if (mergedSession.canManageAll) {
          const listRes = await api.get("/partner/profiles", { headers });
          const items = Array.isArray(listRes.data?.items) ? listRes.data.items : [];
          const sorted = items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
          setProfiles(sorted);
          const initial = sorted.find((item) => item.id === meProfile.id) || sorted[0];
          if (initial) setForm(buildForm(initial));
        } else {
          const only = { ...meProfile, account: meRes.data?.account || null };
          setProfiles([only]);
          setForm(buildForm(only));
        }
      } catch (err) {
        if (!live) return;
        setError(err.response?.data?.message || "Partner session expired. Please login again.");
      } finally {
        if (live) setLoading(false);
      }
    }
    loadPortal();
    return () => {
      live = false;
    };
  }, [headers, navigate, partnerToken]);

  function update(key, value) {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectProfile(profile) {
    if (!profile) return;
    setForm(buildForm(profile));
    setSuccess("");
    setError("");
  }

  async function createProfile() {
    if (!canManageAll) return;
    if (!createForm.loginId.trim() || !createForm.password.trim() || createForm.password.length < 6) {
      setError("Login ID aur minimum 6 character password required.");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/partner/profiles", {
        name: createForm.name.trim() || createForm.loginId.trim(),
        loginId: createForm.loginId.trim(),
        password: createForm.password.trim(),
        phone: createForm.phone.trim()
      }, { headers });
      const item = data?.item;
      if (item) {
        const next = [item, ...profiles];
        setProfiles(next);
        selectProfile(item);
      }
      setCreateForm({ name: "", loginId: "", password: "", phone: "" });
      setSuccess("New partner profile created.");
    } catch (err) {
      setError(err.response?.data?.message || "Partner create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function saveProfile() {
    if (!form.id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = buildPayload(form);
      const endpoint = canManageAll ? `/partner/profiles/${form.id}` : "/partner/profile";
      const method = canManageAll ? api.put : api.patch;
      const { data } = await method(endpoint, payload, { headers });

      const updated = canManageAll ? (data?.item || { ...form, ...payload }) : (data?.profile || { ...form, ...payload });
      if (canManageAll) {
        setProfiles((prev) => prev.map((item) => (item.id === form.id ? { ...item, ...updated } : item)));
      } else {
        setProfiles([{ ...profiles[0], ...updated }]);
      }
      setForm(buildForm({ ...updated, account: data?.account || selectedProfile?.account }));
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleProfileStatus(profile) {
    if (!canManageAll || !profile?.id) return;
    setToggling(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.patch(`/partner/profiles/${profile.id}/status`, {
        active: profile.active === false
      }, { headers });
      const updated = data?.item || { ...profile, active: profile.active === false };
      setProfiles((prev) => prev.map((item) => (item.id === profile.id ? { ...item, ...updated } : item)));
      if (form.id === profile.id) setForm((prev) => ({ ...prev, active: updated.active !== false }));
      setSuccess(`Profile ${updated.active === false ? "deactivated" : "activated"}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed.");
    } finally {
      setToggling(false);
    }
  }

  async function deleteProfile(profile) {
    if (!canManageAll || !profile?.id) return;
    if (profile.id === session?.partnerId) {
      setError("Main partner profile delete nahi kar sakte.");
      return;
    }
    setToggling(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/partner/profiles/${profile.id}`, { headers });
      const next = profiles.filter((item) => item.id !== profile.id);
      setProfiles(next);
      if (form.id === profile.id && next[0]) setForm(buildForm(next[0]));
      setSuccess("Profile removed.");
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setToggling(false);
    }
  }

  async function uploadFiles(kind, fileList) {
    if (!fileList?.length || !form.id) return;
    setUploading(true);
    setError("");
    setSuccess("");
    const limit = kind === "photos" ? MAX_PHOTOS : MAX_VIDEOS;
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
          folder: `partners/${form.id}/${kind}`,
          purpose: kind === "photos" ? "partner_photo" : "partner_video"
        };
        const { data } = await api.post("/media/partner-upload", payload, { headers });
        if (data?.item?.url) urls.push(data.item.url);
      }
      if (!urls.length) return;
      const { data } = await api.post(`/partner/profiles/${form.id}/media`, { kind, urls }, { headers });
      const updated = data?.item || null;
      if (updated) {
        setProfiles((prev) => prev.map((item) => (item.id === form.id ? { ...item, ...updated } : item)));
        setForm(buildForm(updated));
      } else {
        setForm((prev) => ({ ...prev, [kind]: [...existing, ...urls].slice(0, limit) }));
      }
      setSuccess(`${urls.length} ${kind} uploaded.`);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to upload ${kind}.`);
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(kind, index) {
    const limit = kind === "photos" ? MAX_PHOTOS : MAX_VIDEOS;
    const next = toList(form[kind], limit).filter((_, idx) => idx !== index);
    update(kind, next);
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

  const total = profiles.length;
  const activeCount = profiles.filter((item) => item.active !== false).length;

  return (
    <main className="app-shell min-h-screen px-4 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-full bg-zinc-100 p-3"><ArrowLeft size={21} /></button>
        <h1 className="text-3xl font-black">Partner Studio</h1>
        <button onClick={signOut} className="rounded-full bg-zinc-100 p-3"><LogOut size={21} /></button>
      </header>

      <section className="mt-4 rounded-[20px] bg-white p-4 shadow-soft">
        <p className="text-xs font-black text-[#f72565]">Logged in</p>
        <h2 className="mt-1 text-3xl font-black">{session?.loginId || "partner"}</h2>
        <p className="mt-1 text-xs font-semibold text-zinc-500">Partner ID: {session?.partnerId || "-"}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-xl bg-zinc-100 py-2">{total}<div className="text-[10px] text-zinc-500">Total</div></div>
          <div className="rounded-xl bg-emerald-50 py-2 text-emerald-700">{activeCount}<div className="text-[10px] text-emerald-500">Active</div></div>
          <div className="rounded-xl bg-zinc-100 py-2">{Math.max(0, total - activeCount)}<div className="text-[10px] text-zinc-500">Inactive</div></div>
        </div>
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
      {success && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</p>}

      {canManageAll && (
        <section className="mt-4 rounded-[20px] bg-white p-4 shadow-soft">
          <h3 className="text-lg font-black">Add Partner</h3>
          <div className="mt-3 grid gap-2">
            <input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Partner name" />
            <input value={createForm.loginId} onChange={(e) => setCreateForm((p) => ({ ...p, loginId: e.target.value }))} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Partner login ID" />
            <input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Partner password" />
            <input value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Phone" />
            <button disabled={creating} onClick={createProfile} className="pink-gradient mt-1 flex h-11 items-center justify-center gap-2 rounded-full font-black text-white disabled:opacity-60">
              {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Add Partner
            </button>
          </div>
        </section>
      )}

      {canManageAll && (
        <section className="mt-4 rounded-[20px] bg-[#fff0f6] p-3">
          <h3 className="px-2 text-sm font-black text-zinc-700">All Partners</h3>
          <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
            {profiles.map((item) => {
              const selected = item.id === form.id;
              return (
                <div key={item.id} className={`rounded-xl border p-3 ${selected ? "border-[#f72565] bg-white" : "border-transparent bg-white/80"}`}>
                  <button onClick={() => selectProfile(item)} className="w-full text-left">
                    <p className="text-sm font-black">{item.name || item.account?.loginId || item.id}</p>
                    <p className="text-[11px] text-zinc-500">{item.account?.loginId || item.id}</p>
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleProfileStatus(item)}
                      disabled={toggling}
                      className="rounded-full bg-zinc-100 p-2"
                      title="Toggle active"
                    >
                      {item.active === false ? <ToggleLeft size={16} /> : <ToggleRight size={16} className="text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => deleteProfile(item)}
                      disabled={toggling}
                      className="rounded-full bg-zinc-100 p-2 text-red-500"
                      title="Delete profile"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-4 space-y-4">
        <article className="rounded-[20px] bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="text-[#f72565]" size={20} />
            <h3 className="text-lg font-black">Profile Basics</h3>
          </div>
          <div className="grid gap-2">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Display name" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.age} onChange={(e) => update("age", e.target.value)} inputMode="numeric" className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Age" />
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none">
                <option>Woman</option>
                <option>Man</option>
                <option>Other</option>
              </select>
            </div>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="City" />
            <input value={form.location} onChange={(e) => update("location", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Location" />
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Phone" />
            <input value={form.category} onChange={(e) => update("category", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Category" />
            <input value={form.profession} onChange={(e) => update("profession", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Profession" />
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Bio" />
            <input value={form.interests} onChange={(e) => update("interests", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Interests (comma separated)" />
          </div>
        </article>

        <article className="rounded-[20px] bg-[#fff0f5] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImagePlus className="text-[#f72565]" size={20} />
              <h3 className="text-lg font-black">Photos (max 7)</h3>
            </div>
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-black text-[#f72565]">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles("photos", e.target.files)} />
              <span className="inline-flex items-center gap-2"><Upload size={14} /> Upload</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {toList(form.photos, MAX_PHOTOS).map((url, index) => (
              <div key={`${url}_${index}`} className="relative overflow-hidden rounded-xl bg-white">
                <img src={url} alt="" className="h-20 w-full object-cover" />
                <button onClick={() => removeMedia("photos", index)} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"><X size={12} /></button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] bg-zinc-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="text-zinc-700" size={20} />
              <h3 className="text-lg font-black">Videos (max 2)</h3>
            </div>
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700">
              <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => uploadFiles("videos", e.target.files)} />
              <span className="inline-flex items-center gap-2"><Upload size={14} /> Upload</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {toList(form.videos, MAX_VIDEOS).map((url, index) => (
              <div key={`${url}_${index}`} className="relative overflow-hidden rounded-xl bg-white">
                <video src={url} className="h-28 w-full object-cover" muted loop playsInline autoPlay />
                <button onClick={() => removeMedia("videos", index)} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"><X size={12} /></button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Settings2 className="text-[#f72565]" size={20} />
            <h3 className="text-lg font-black">Auto Reply & Rates</h3>
          </div>
          <div className="grid gap-2">
            <input value={form.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Welcome message" />
            <input value={form.firstReply} onChange={(e) => update("firstReply", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="First reply" />
            <input value={form.secondReply} onChange={(e) => update("secondReply", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Second reply / recharge message" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.freeReplyLimit} onChange={(e) => update("freeReplyLimit", e.target.value)} inputMode="numeric" className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Free reply limit" />
              <input value={form.delayMs} onChange={(e) => update("delayMs", e.target.value)} inputMode="numeric" className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Delay ms" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.chatPrice} onChange={(e) => update("chatPrice", e.target.value)} inputMode="numeric" className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Chat price" />
              <input value={form.voiceCallPrice} onChange={(e) => update("voiceCallPrice", e.target.value)} inputMode="numeric" className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Call price" />
            </div>
          </div>
        </article>

        <article className="rounded-[20px] bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-lg font-black">Login Settings</h3>
          <div className="grid gap-2">
            <input value={form.loginId} onChange={(e) => update("loginId", e.target.value)} className="rounded-xl bg-zinc-100 px-4 py-3 outline-none" placeholder="Login ID" />
          </div>
        </article>

        <button disabled={saving || uploading} onClick={saveProfile} className="pink-gradient flex h-12 w-full items-center justify-center gap-2 rounded-full font-black text-white disabled:opacity-60">
          {(saving || uploading) ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {uploading ? "Uploading..." : saving ? "Saving..." : "Save Partner Profile"}
        </button>
      </section>
    </main>
  );
}
