import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import adminApi from "../services/adminApi";

export default function ResourcePage({ title, endpoint, fields }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    adminApi.get(endpoint).then(({ data }) => setRows(data.items || [])).catch(() => setRows([]));
  }, [endpoint]);

  const columns = useMemo(() => fields.slice(0, 5).map((field) => ({ key: field, label: field })), [fields]);

  async function save() {
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "true" ? true : v === "false" ? false : v]));
    const { data } = await adminApi.post(endpoint, payload);
    setRows((old) => [data.item, ...old]);
    setForm({});
  }

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-black">{title}</h1>
      <div className="rounded-2xl bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3">
          {fields.map((field) => (
            <input key={field} value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={field} className="rounded-xl border border-pink-100 px-4 py-3 outline-none focus:border-roseSoft" />
          ))}
        </div>
        <button onClick={save} className="mt-4 rounded-xl bg-roseSoft px-5 py-3 font-semibold text-white">Save</button>
      </div>
      <DataTable rows={rows} columns={columns} />
    </section>
  );
}
