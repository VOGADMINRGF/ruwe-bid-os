"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MissingVariableAnswerForm({
  id,
  question,
  answerKind,
  answerOptions,
  answerPlaceholder,
  answerUnit
}: {
  id: string;
  question: string;
  answerKind?: string | null;
  answerOptions?: string[] | null;
  answerPlaceholder?: string | null;
  answerUnit?: string | null;
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
      {Array.isArray(answerOptions) && answerOptions.length ? (
        <select
          className="select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ marginTop: 14 }}
        >
          <option value="">Bitte wählen</option>
          {answerOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={answerPlaceholder || "Antwort eintragen"}
          style={{ marginTop: 14 }}
        />
      )}
      <div className="meta" style={{ marginTop: 8 }}>
        Erwarteter Typ: {answerKind || "text"}
        {answerUnit ? ` · Einheit: ${answerUnit}` : ""}
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Antwort speichern"}
        </button>
      </div>
    </div>
  );
}
