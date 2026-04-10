"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QueryConfigEditor({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [data, setData] = useState(rows);

  async function updateRow(id: string, patch: Record<string, any>) {
    setData((prev: any[]) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    await fetch(`/api/query-config/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Quelle</th>
            <th>Gewerk</th>
            <th>Region</th>
            <th>Query</th>
            <th>Priorität</th>
            <th>Aktiv</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.sourceId}</td>
              <td>{row.trade}</td>
              <td>{row.region}</td>
              <td>
                <input
                  className="input"
                  value={row.query}
                  onChange={(e) => updateRow(row.id, { query: e.target.value })}
                />
              </td>
              <td>
                <select
                  className="select"
                  value={row.priority}
                  onChange={(e) => updateRow(row.id, { priority: e.target.value })}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!row.active}
                  onChange={(e) => updateRow(row.id, { active: e.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
