export default function DataTable({ rows, columns }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-soft">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-blush text-roseDeep">
          <tr>{columns.map((col) => <th key={col.key} className="px-4 py-3">{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-pink-50">
              {columns.map((col) => <td key={col.key} className="px-4 py-3">{col.render ? col.render(row) : String(row[col.key] ?? "-")}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No records found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
