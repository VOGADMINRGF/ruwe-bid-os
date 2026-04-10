"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpportunityNoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${id}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: "admin", text })
      });
      setText("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Notiz hinzufügen</div>
      <textarea
        className="input"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hinweis, Entscheidung, Rückfrage, Angebotsgedanke ..."
        style={{ marginTop: 14, minHeight: 120 }}
      />
      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Notiz speichern"}
        </button>
      </div>
    </div>
  );
}
