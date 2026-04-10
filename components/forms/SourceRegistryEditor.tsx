"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  type?: string;
  active?: boolean;
  legalUse?: string;
  dataMode?: string;
  notes?: string;
  supportsFeed?: boolean;
  supportsManualImport?: boolean;
  supportsDeepLink?: boolean;
};

export default function SourceRegistryEditor({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [data, setData] = useState(rows || []);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  async function patchRow(id: string, patch: Record<string, any>) {
    setData((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSavingMap((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`/api/source-registry/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch)
      });
      router.refresh();
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Quelle</th>
            <th>Typ</th>
            <th>Aktiv</th>
            <th>Legal Use</th>
            <th>Datenmodus</th>
            <th>Feed</th>
            <th>Manual</th>
            <th>Deep-Link</th>
            <th>Notiz</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  className="input"
                  defaultValue={row.name || ""}
                  onBlur={(e) => patchRow(row.id, { name: e.target.value })}
                />
                <div className="meta" style={{ marginTop: 6 }}>{row.id}</div>
              </td>
              <td>
                <select
                  className="select"
                  value={row.type || "portal"}
                  onChange={(e) => patchRow(row.id, { type: e.target.value })}
                >
                  <option value="rss">rss</option>
                  <option value="api">api</option>
                  <option value="portal_rss">portal_rss</option>
                  <option value="portal">portal</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={row.active !== false}
                  onChange={(e) => patchRow(row.id, { active: e.target.checked })}
                />
              </td>
              <td>
                <select
                  className="select"
                  value={row.legalUse || "mittel"}
                  onChange={(e) => patchRow(row.id, { legalUse: e.target.value })}
                >
                  <option value="hoch">hoch</option>
                  <option value="mittel">mittel</option>
                  <option value="vorsicht">vorsicht</option>
                </select>
              </td>
              <td>
                <select
                  className="select"
                  value={row.dataMode || "live"}
                  onChange={(e) => patchRow(row.id, { dataMode: e.target.value })}
                >
                  <option value="live">live</option>
                  <option value="demo">demo</option>
                  <option value="mixed">mixed</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={row.supportsFeed !== false}
                  onChange={(e) => patchRow(row.id, { supportsFeed: e.target.checked })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={row.supportsManualImport !== false}
                  onChange={(e) => patchRow(row.id, { supportsManualImport: e.target.checked })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={row.supportsDeepLink === true}
                  onChange={(e) => patchRow(row.id, { supportsDeepLink: e.target.checked })}
                />
              </td>
              <td>
                <input
                  className="input"
                  defaultValue={row.notes || ""}
                  onBlur={(e) => patchRow(row.id, { notes: e.target.value })}
                  placeholder="Operativer Hinweis"
                />
              </td>
              <td>{savingMap[row.id] ? "speichert..." : "ok"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
