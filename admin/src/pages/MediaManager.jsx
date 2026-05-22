import { useEffect, useMemo, useState } from "react";
import { Image, Loader2, Upload, Video } from "lucide-react";
import DataTable from "../components/DataTable";
import adminApi from "../services/adminApi";

const purposes = [
  "welcome-wallpaper",
  "onboarding-banner",
  "promo-banner",
  "offer-banner",
  "partner-media",
  "bot-media",
  "announcement-media"
];

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaManager() {
  const [rows, setRows] = useState([]);
  const [purpose, setPurpose] = useState(purposes[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const columns = useMemo(() => [
    { key: "title", label: "title" },
    { key: "purpose", label: "purpose" },
    { key: "kind", label: "kind" },
    { key: "url", label: "url" },
    { key: "active", label: "active" }
  ], []);

  useEffect(() => {
    adminApi.get("/admin/mediaAssets").then(({ data }) => setRows(data.items || [])).catch(() => setRows([]));
  }, []);

  async function uploadFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setMessage("");
    try {
      const uploaded = [];
      for (const file of files) {
        if (!/^(image|video)\//.test(file.type)) throw new Error("Only photos and videos are supported here.");
        const base64 = await toBase64(file);
        const { data } = await adminApi.post("/admin/upload-media", {
          base64,
          contentType: file.type,
          fileName: file.name,
          purpose,
          folder: `admin/${purpose}`
        });
        uploaded.push(data.item);
      }
      setRows((old) => [...uploaded, ...old]);
      setMessage(`${uploaded.length} media file uploaded.`);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[.16em] text-roseDeep">Content</p>
        <h1 className="text-3xl font-black">Media Control</h1>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-bold text-slate-600">
            Media purpose
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft">
              {purposes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-roseSoft px-5 font-black text-white">
            {busy ? <Loader2 size={19} className="animate-spin" /> : <Upload size={19} />}
            Upload photos/videos
            <input type="file" multiple accept="image/*,video/*" onChange={uploadFiles} className="hidden" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-500 md:grid-cols-3">
          <p className="flex items-center gap-2"><Image size={18} className="text-roseDeep" /> Photos for banners, partners, bots, announcements</p>
          <p className="flex items-center gap-2"><Video size={18} className="text-roseDeep" /> Short videos for partner and bot media</p>
          <p>After upload, paste the returned URL into settings, partner, bot, plan, or offer records.</p>
        </div>
        {message && <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm font-bold text-roseDeep">{message}</p>}
      </div>

      <DataTable rows={rows} columns={columns} />
    </section>
  );
}
