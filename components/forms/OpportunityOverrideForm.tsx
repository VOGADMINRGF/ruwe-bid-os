"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpportunityOverrideForm({
  id,
  currentDecision
}: {
  id: string;
  currentDecision?: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState(currentDecision || "Prüfen");
  const [reason, setReason] = useState("");
  const [learn, setLearn] = useState(true);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${id}/override`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reason,
          learn,
          by: "admin"
        })
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">KI-Entscheidung korrigieren</div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <select className="select" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="Bid">Bid</option>
          <option value="Prüfen">Prüfen</option>
          <option value="No-Bid">No-Bid</option>
          <option value="No-Go">No-Go</option>
        </select>
        <label className="meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={learn} onChange={(e) => setLearn(e.target.checked)} />
          Für ähnliche Fälle lernen
        </label>
      </div>

      <textarea
        className="input"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Kurz begründen, warum die KI hier falsch oder unvollständig lag ..."
        style={{ marginTop: 14, minHeight: 110 }}
      />

      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Korrektur speichern"}
        </button>
      </div>
    </div>
  );
}
