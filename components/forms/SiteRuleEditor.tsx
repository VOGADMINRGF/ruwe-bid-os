"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SiteRuleEditor({ rule }: { rule: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    trade: rule.trade || "",
    priority: rule.priority || "mittel",
    primaryRadiusKm: rule.primaryRadiusKm || 25,
    secondaryRadiusKm: rule.secondaryRadiusKm || 50,
    tertiaryRadiusKm: rule.tertiaryRadiusKm || 75,
    monthlyCapacity: rule.monthlyCapacity || 5,
    concurrentCapacity: rule.concurrentCapacity || 2,
    enabled: Boolean(rule.enabled),
    keywordsPositive: (rule.keywordsPositive || []).join(", "),
    keywordsNegative: (rule.keywordsNegative || []).join(", "),
    regionNotes: rule.regionNotes || ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/site-rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        keywordsPositive: form.keywordsPositive.split(",").map((x: string) => x.trim()).filter(Boolean),
        keywordsNegative: form.keywordsNegative.split(",").map((x: string) => x.trim()).filter(Boolean)
      })
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Gewerk</span>
          <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
        </label>
        <label className="stack">
          <span className="label">Priorität</span>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="hoch">hoch</option>
            <option value="mittel">mittel</option>
            <option value="niedrig">niedrig</option>
          </select>
        </label>
        <label className="stack">
          <span className="label">Aktiv</span>
          <select className="input" value={form.enabled ? "true" : "false"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "true" })}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Primär km</span>
          <input className="input" type="number" value={form.primaryRadiusKm} onChange={(e) => setForm({ ...form, primaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Sekundär km</span>
          <input className="input" type="number" value={form.secondaryRadiusKm} onChange={(e) => setForm({ ...form, secondaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Tertiär km</span>
          <input className="input" type="number" value={form.tertiaryRadiusKm} onChange={(e) => setForm({ ...form, tertiaryRadiusKm: Number(e.target.value) })} />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Monatskapazität</span>
          <input className="input" type="number" value={form.monthlyCapacity} onChange={(e) => setForm({ ...form, monthlyCapacity: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Parallele Kapazität</span>
          <input className="input" type="number" value={form.concurrentCapacity} onChange={(e) => setForm({ ...form, concurrentCapacity: Number(e.target.value) })} />
        </label>
      </div>

      <label className="stack">
        <span className="label">Positive Keywords (kommagetrennt)</span>
        <input className="input" value={form.keywordsPositive} onChange={(e) => setForm({ ...form, keywordsPositive: e.target.value })} />
      </label>

      <label className="stack">
        <span className="label">Negative Keywords (kommagetrennt)</span>
        <input className="input" value={form.keywordsNegative} onChange={(e) => setForm({ ...form, keywordsNegative: e.target.value })} />
      </label>

      <label className="stack">
        <span className="label">Regionshinweis</span>
        <input className="input" value={form.regionNotes} onChange={(e) => setForm({ ...form, regionNotes: e.target.value })} />
      </label>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Regel speichern"}
      </button>
    </form>
  );
}
