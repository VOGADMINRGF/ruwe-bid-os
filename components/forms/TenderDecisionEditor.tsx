"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TenderDecisionEditor({ tender }: { tender: any }) {
  const router = useRouter();
  const [decision, setDecision] = useState(tender.decision || "Prüfen");
  const [manualReview, setManualReview] = useState(tender.manualReview || "optional");
  const [ownerId, setOwnerId] = useState(tender.ownerId || "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/tenders/${tender.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        manualReview,
        ownerId,
        status:
          decision === "Go"
            ? "go"
            : decision === "No-Go"
              ? "no_go"
              : "manuelle_pruefung"
      })
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Entscheidung</span>
          <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="Go">Go</option>
            <option value="Prüfen">Prüfen</option>
            <option value="No-Go">No-Go</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Manual Review</span>
          <select className="input" value={manualReview} onChange={(e) => setManualReview(e.target.value)}>
            <option value="zwingend">zwingend</option>
            <option value="optional">optional</option>
            <option value="nein">nein</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Owner ID</span>
          <input className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
        </label>
      </div>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Tender aktualisieren"}
      </button>
    </form>
  );
}
