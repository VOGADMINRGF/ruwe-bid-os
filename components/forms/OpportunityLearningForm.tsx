"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OpportunityLearningForm({ opportunity }: { opportunity: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    defaultRate: "",
    unit: "",
    travelCost: "",
    travelUnit: "€",
    specKey: "",
    specValue: "",
    specUnit: "",
    status: "confirmed",
    note: ""
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/opportunities/${opportunity.id}/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Standardrate</span>
          <input className="input" value={form.defaultRate} onChange={(e) => setForm({ ...form, defaultRate: e.target.value })} placeholder="z. B. 18.5" />
        </label>

        <label className="stack">
          <span className="label">Einheit</span>
          <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="€/qm_monat, €/stunde, €/monat_objekt" />
        </label>

        <label className="stack">
          <span className="label">Anfahrtskosten</span>
          <input className="input" value={form.travelCost} onChange={(e) => setForm({ ...form, travelCost: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Anfahrts-Einheit</span>
          <input className="input" value={form.travelUnit} onChange={(e) => setForm({ ...form, travelUnit: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Spezifikations-Key</span>
          <input className="input" value={form.specKey} onChange={(e) => setForm({ ...form, specKey: e.target.value })} placeholder="z. B. winterdienst_reaktionszeit" />
        </label>

        <label className="stack">
          <span className="label">Spezifikations-Wert</span>
          <input className="input" value={form.specValue} onChange={(e) => setForm({ ...form, specValue: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Spezifikations-Einheit</span>
          <input className="input" value={form.specUnit} onChange={(e) => setForm({ ...form, specUnit: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Status</span>
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">draft</option>
            <option value="confirmed">confirmed</option>
          </select>
        </label>
      </div>

      <label className="stack">
        <span className="label">Lernnotiz</span>
        <textarea className="input" style={{ minHeight: 120, paddingTop: 12 }} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>

      <div className="toolbar">
        <button className="button" type="button" onClick={save} disabled={saving}>
          {saving ? "Übernimmt..." : "Als Lernwert übernehmen"}
        </button>
      </div>
    </div>
  );
}
