import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import adminApi from "../services/adminApi";

const longFields = new Set(["bio", "photos", "videos", "galleryPhotos", "personalityConfig", "keywords", "welcomeMessage", "firstReply", "secondReply", "limitReachedMessage", "rechargeMessage", "voiceCallLockedMessage", "qrImage", "bannerUrl", "maintenanceMessage"]);
const booleanFields = new Set(["active", "verified", "online", "autoPay", "subscription", "subscriptionEnabled", "manualFailover", "showInDiscovery", "showInMatches", "allowAutoContact", "rechargeTrigger", "offerTrigger", "autoRecycleOnExhaustion", "maintenanceMode"]);
const uploadFields = new Set(["photos", "videos", "galleryPhotos", "qrImage", "bannerUrl"]);

function initialForm(fields) {
  return Object.fromEntries(fields.map((field) => [field, booleanFields.has(field) ? "true" : ""]));
}

export default function ResourcePage({ title, endpoint, fields }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => initialForm(fields));
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState("");

  async function load() {
    const { data } = await adminApi.get(endpoint);
    setRows(data.items || []);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [endpoint]);

  const columns = useMemo(() => fields.slice(0, 5).map((field) => ({ key: field, label: field })), [fields]);

  function cleanPayload() {
    return Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => value !== "")
        .filter(([, value]) => value !== "stored in backend" && !String(value).endsWith("...stored"))
        .map(([key, value]) => [key, value === "true" ? true : value === "false" ? false : value])
    );
  }

  async function save() {
    setMessage("");
    const payload = cleanPayload();
    const { data } = editingId
      ? await adminApi.patch(`${endpoint}/${editingId}`, payload)
      : await adminApi.post(endpoint, payload);
    if (editingId) {
      await load();
      setMessage("Record updated.");
    } else {
      setRows((old) => [data.item, ...old]);
      setMessage("Record created.");
    }
    setEditingId("");
    setForm(initialForm(fields));
  }

  function edit(row) {
    setEditingId(row.id);
    setForm(Object.fromEntries(fields.map((field) => {
      const value = row[field];
      return [field, Array.isArray(value) ? value.join(", ") : value ?? ""];
    })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadIntoField(field, file) {
    if (!file) return;
    setUploading(field);
    setMessage("");
    try {
      const isVideo = file.type.startsWith("video/");
      const base64 = await readFileAsBase64(file);
      const { data } = await adminApi.post("/admin/upload-media", {
        base64,
        contentType: file.type,
        fileName: file.name,
        purpose: field,
        folder: `admin/${field}`
      });
      const url = data.item?.url;
      if (!url) throw new Error("Upload did not return a URL.");
      setForm((old) => {
        const existing = String(old[field] || "").trim();
        const nextValue = field === "qrImage" || field === "bannerUrl"
          ? url
          : [existing, url].filter(Boolean).join(", ");
        return { ...old, [field]: nextValue };
      });
      setMessage(`${isVideo ? "Video" : "Photo"} uploaded into ${field}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Upload failed.");
    } finally {
      setUploading("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-black">{title}</h1>
        {editingId && <button onClick={() => { setEditingId(""); setForm(initialForm(fields)); }} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">Cancel edit</button>}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <p className="mb-4 rounded-xl bg-pink-50 px-4 py-3 text-sm font-semibold text-roseDeep">
          Photos field me comma-separated URLs daalo. Partners/bots ke liye max 7 photos aur max 3 videos save honge.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {fields.map((field) => {
            if (booleanFields.has(field)) {
              return (
                <select key={field} value={form[field] ?? "true"} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft">
                  <option value="true">{field}: true</option>
                  <option value="false">{field}: false</option>
                </select>
              );
            }
            if (longFields.has(field)) {
              return (
                <div key={field} className="md:col-span-3">
                  <textarea value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field} rows="3" className="w-full rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
                  {uploadFields.has(field) && (
                    <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl bg-pink-50 px-4 py-2 text-sm font-black text-roseDeep">
                      {uploading === field ? "Uploading..." : `Upload ${field.includes("video") ? "video" : "photo/video"}`}
                      <input
                        type="file"
                        accept={field === "videos" ? "video/*" : "image/*,video/*"}
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          uploadIntoField(field, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            }
            return (
              <input key={field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field} className="rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
            );
          })}
        </div>
        <button onClick={save} className="mt-4 rounded-xl bg-roseSoft px-5 py-3 font-semibold text-white">{editingId ? "Update" : "Save"}</button>
        {message && <span className="ml-3 text-sm font-bold text-emerald-600">{message}</span>}
      </div>
      <DataTable rows={rows} columns={[...columns, { key: "actions", label: "actions", render: (row) => <button onClick={() => edit(row)} className="rounded-lg bg-blush px-3 py-2 font-bold text-roseDeep">Edit</button> }]} />
    </section>
  );
}
