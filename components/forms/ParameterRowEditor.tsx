"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParameterRowEditor({ row }: { row: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    region: row.region || "",
    trade: row.trade || "",
    parameterType: row.parameterType || "",
    parameterKey: row.parameterKey || "",
    value: row.value ?? "",
    unit: row.unit || "",
    status: row.status || "draft",
    confidence: row.confidence ?? 0.8,
    note: row.note || ""
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/parameter-memory/${row.id}`, {
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
          <span className="label">Region</span>
          <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Geschäftsfeld</span>
          <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Typ</span>
          <input className="input" value={form.parameterType} onChange={(e) => setForm({ ...form, parameterType: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Key</span>
          <input className="input" value={form.parameterKey} onChange={(e) => setForm({ ...form, parameterKey: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Wert</span>
          <input className="input" value={String(form.value)} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Einheit</span>
          <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </label>

        <label className="stack">
          <span className="label">Status</span>
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="open">open</option>
            <option value="draft">draft</option>
            <option value="confirmed">confirmed</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Confidence</span>
          <input className="input" value={String(form.confidence)} onChange={(e) => setForm({ ...form, confidence: e.target.value })} />
        </label>
      </div>

      <label className="stack">
        <span className="label">Notiz</span>
        <textarea className="input" style={{ minHeight: 120, paddingTop: 12 }} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>

      <div className="toolbar">
        <button className="button" type="button" onClick={save} disabled={saving}>
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </div>
  );
}
