"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OpportunityEditor({ opportunity, agents }: { opportunity: any; agents: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    stage: opportunity.stage || "",
    priority: opportunity.priority || "",
    ownerId: opportunity.ownerId || "",
    nextStep: opportunity.nextStep || "",
    dueDate: opportunity.dueDate || "",
    manualDecision: opportunity.manualDecision || "",
    manualReason: opportunity.manualReason || "",
    status: opportunity.status || "open"
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/opportunities/${opportunity.id}`, {
      method: "PATCH",
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
          <span className="label">Stage</span>
          <select className="select" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            <option value="Qualifiziert">Qualifiziert</option>
            <option value="Review">Review</option>
            <option value="Freigabe intern">Freigabe intern</option>
            <option value="Angebot">Angebot</option>
            <option value="Eingereicht">Eingereicht</option>
            <option value="Verhandlung">Verhandlung</option>
            <option value="Gewonnen">Gewonnen</option>
            <option value="Verloren">Verloren</option>
            <option value="No-Bid">No-Bid</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Priorität</span>
          <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Owner</span>
          <select className="select" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">Nicht zugewiesen</option>
            {agents.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label className="stack">
          <span className="label">Status</span>
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="open">offen</option>
            <option value="active">aktiv</option>
            <option value="done">erledigt</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Frist</span>
          <input className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Manuelle Entscheidung</span>
          <select className="select" value={form.manualDecision} onChange={(e) => setForm({ ...form, manualDecision: e.target.value })}>
            <option value="">keine</option>
            <option value="Bid">Bid</option>
            <option value="Prüfen">Prüfen</option>
            <option value="No-Go">No-Go</option>
          </select>
        </label>
      </div>

      <label className="stack">
        <span className="label">Nächster Schritt</span>
        <input className="input" value={form.nextStep} onChange={(e) => setForm({ ...form, nextStep: e.target.value })} />
      </label>

      <label className="stack">
        <span className="label">Manuelle Begründung</span>
        <textarea className="input" style={{ minHeight: 120, paddingTop: 12 }} value={form.manualReason} onChange={(e) => setForm({ ...form, manualReason: e.target.value })} />
      </label>

      <div className="toolbar">
        <button className="button" type="button" onClick={save} disabled={saving}>
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </div>
  );
}
