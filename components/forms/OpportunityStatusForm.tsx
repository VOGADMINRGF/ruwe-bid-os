"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpportunityStatusForm({
  id,
  currentStage,
  currentDecision
}: {
  id: string;
  currentStage?: string;
  currentDecision?: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage || "neu");
  const [decision, setDecision] = useState(currentDecision || "Prüfen");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage, decision })
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Status ändern</div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="neu">neu</option>
          <option value="review">review</option>
          <option value="qualifiziert">qualifiziert</option>
          <option value="angebot">angebot</option>
          <option value="beobachten">beobachten</option>
          <option value="archiv">archiv</option>
        </select>

        <select className="select" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="Bid">Bid</option>
          <option value="Prüfen">Prüfen</option>
          <option value="No-Bid">No-Bid</option>
          <option value="Unklar">Unklar</option>
        </select>
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Status speichern"}
        </button>
      </div>
    </div>
  );
}
