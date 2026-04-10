"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectorEditor({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [data, setData] = useState(rows);

  async function patch(id: string, patch: Record<string, any>) {
    setData((prev: any[]) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    await fetch(`/api/connectors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  async function test(id: string) {
    await fetch(`/api/connectors/${id}/test`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Auth</th>
            <th>Base URL</th>
            <th>Query</th>
            <th>Deep-Link</th>
            <th>Status</th>
            <th>Test</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>
                <select className="select" value={row.authType} onChange={(e) => patch(row.id, { authType: e.target.value })}>
                  <option value="none">none</option>
                  <option value="basic">basic</option>
                  <option value="session">session</option>
                  <option value="api_key">api_key</option>
                </select>
              </td>
              <td>
                <input className="input" value={row.baseUrl || ""} onChange={(e) => patch(row.id, { baseUrl: e.target.value })} />
              </td>
              <td>
                <input type="checkbox" checked={!!row.supportsQuerySearch} onChange={(e) => patch(row.id, { supportsQuerySearch: e.target.checked })} />
              </td>
              <td>
                <input type="checkbox" checked={!!row.supportsDeepLink} onChange={(e) => patch(row.id, { supportsDeepLink: e.target.checked })} />
              </td>
              <td>{row.status || "-"}</td>
              <td><button className="linkish" type="button" onClick={() => test(row.id)}>testen</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
