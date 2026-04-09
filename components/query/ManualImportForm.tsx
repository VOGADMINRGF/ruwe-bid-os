"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManualImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [sourceId, setSourceId] = useState("src_service_bund");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await fetch("/api/ops/manual-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, sourceId })
    });
    setSaving(false);
    setUrl("");
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <label className="stack">
        <span className="label">Quelle</span>
        <select className="select" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="src_service_bund">service.bund.de</option>
          <option value="src_ted">TED</option>
          <option value="src_berlin">Vergabeplattform Berlin</option>
          <option value="src_dtvp">DTVP</option>
          <option value="manual">Manuell</option>
        </select>
      </label>

      <label className="stack">
        <span className="label">Treffer-URL</span>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </label>

      <div className="toolbar">
        <button className="button" type="button" onClick={submit} disabled={saving || !url}>
          {saving ? "Importiert..." : "Manuell importieren"}
        </button>
      </div>
    </div>
  );
}
