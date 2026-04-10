"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MissingVariableAnswerForm({
  id,
  question
}: {
  id: string;
  question: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/missing-variables/${id}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value, status: "defined" })
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Variable beantworten</div>
      <div className="meta" style={{ marginTop: 14 }}>{question}</div>
      <input
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="z. B. 42,50 €/Std. oder Mischmodell oder 24 Monate"
        style={{ marginTop: 14 }}
      />
      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Antwort speichern"}
        </button>
      </div>
    </div>
  );
}
