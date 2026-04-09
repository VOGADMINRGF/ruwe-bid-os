"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SiteCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    type: "Gesellschaft",
    active: true,
    primaryRadiusKm: 25,
    secondaryRadiusKm: 50,
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setSaving(false);
    router.push(`/sites/${data.id}`);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Name</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="stack">
          <span className="label">Stadt</span>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Bundesland</span>
          <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
        </label>
        <label className="stack">
          <span className="label">Typ</span>
          <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </label>
        <label className="stack">
          <span className="label">Aktiv</span>
          <select className="input" value={form.active ? "true" : "false"} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </label>
      </div>

      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Primärradius km</span>
          <input className="input" type="number" value={form.primaryRadiusKm} onChange={(e) => setForm({ ...form, primaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Sekundärradius km</span>
          <input className="input" type="number" value={form.secondaryRadiusKm} onChange={(e) => setForm({ ...form, secondaryRadiusKm: Number(e.target.value) })} />
        </label>
      </div>

      <label className="stack">
        <span className="label">Notizen</span>
        <textarea className="input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Standort anlegen"}
      </button>
    </form>
  );
}
