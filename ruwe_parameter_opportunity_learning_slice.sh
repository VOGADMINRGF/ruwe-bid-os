#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Parameter Memory + Opportunity Learning Slice"

mkdir -p components/forms
mkdir -p app/api/parameter-memory/[id]
mkdir -p app/api/opportunities/[id]/learn
mkdir -p app/parameter-memory/[id]

echo "🧠 Parameter helpers ..."
cat > lib/parameterLearning.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "pm") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listParameterRows() {
  const db = await readStore();
  return Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
}

export async function getParameterRow(id: string) {
  const rows = await listParameterRows();
  return rows.find((x: any) => x.id === id) || null;
}

export async function updateParameterRow(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );
  await replaceCollection("parameterMemory" as any, next);
  return next.find((x: any) => x.id === id) || null;
}

export async function createParameterRow(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const row = {
    id: nextId(),
    region: body.region || "Unbekannt",
    trade: body.trade || "Unbekannt",
    parameterType: body.parameterType || "cost",
    parameterKey: body.parameterKey || "default_rate",
    value: body.value ?? null,
    unit: body.unit || "",
    source: body.source || "manual",
    confidence: body.confidence ?? 0.8,
    status: body.status || "draft",
    note: body.note || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("parameterMemory" as any, [...rows, row]);
  return row;
}

export async function learnFromOpportunity(opportunityId: string, payload: Record<string, any>) {
  const db = await readStore();
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const opportunity = opportunities.find((x: any) => x.id === opportunityId);

  if (!opportunity) throw new Error("Opportunity nicht gefunden");

  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const additions: any[] = [];

  if (payload.defaultRate !== undefined && payload.defaultRate !== null && payload.defaultRate !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "cost",
      parameterKey: "default_rate",
      value: Number(payload.defaultRate),
      unit: payload.unit || "",
      source: "opportunity_feedback",
      confidence: 0.9,
      status: payload.status || "confirmed",
      note: payload.note || "Aus Opportunity-Lernfeedback übernommen.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (payload.travelCost !== undefined && payload.travelCost !== null && payload.travelCost !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "cost",
      parameterKey: "travel_cost",
      value: Number(payload.travelCost),
      unit: payload.travelUnit || "€",
      source: "opportunity_feedback",
      confidence: 0.85,
      status: payload.status || "confirmed",
      note: payload.note || "Anfahrtskosten aus Opportunity-Lernfeedback.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (payload.specKey && payload.specValue !== undefined && payload.specValue !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "spec",
      parameterKey: String(payload.specKey),
      value: payload.specValue,
      unit: payload.specUnit || "",
      source: "opportunity_feedback",
      confidence: 0.8,
      status: payload.status || "confirmed",
      note: payload.note || "Spezifikation aus Opportunity-Lernfeedback.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  await replaceCollection("parameterMemory" as any, [...rows, ...additions]);

  return {
    ok: true,
    added: additions.length,
    rows: additions
  };
}
TS

echo "🧩 Parameter memory APIs ..."
cat > app/api/parameter-memory/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { getParameterRow, updateParameterRow } from "@/lib/parameterLearning";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(await getParameterRow(id));
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateParameterRow(id, body));
}
TS

echo "🧩 Opportunity learning API ..."
cat > app/api/opportunities/[id]/learn/route.ts <<'TS'
import { NextResponse } from "next/server";
import { learnFromOpportunity } from "@/lib/parameterLearning";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const result = await learnFromOpportunity(id, body);
  return NextResponse.json(result);
}
TS

echo "🧩 Parameter editor component ..."
cat > components/forms/ParameterRowEditor.tsx <<'TSX'
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
TSX

echo "🧩 Opportunity learning form ..."
cat > components/forms/OpportunityLearningForm.tsx <<'TSX'
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
TSX

echo "🧩 Parameter detail page ..."
cat > app/parameter-memory/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { getParameterRow } from "@/lib/parameterLearning";
import ParameterRowEditor from "@/components/forms/ParameterRowEditor";

export default async function ParameterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getParameterRow(id);

  if (!row) notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Parameter</span> bearbeiten</h1>
        <p className="sub">Regionale Lern- und Kalkulationsbasis für künftige Ausschreibungen.</p>
      </div>

      <div className="card">
        <div className="section-title">{row.region} · {row.trade}</div>
        <div style={{ marginTop: 16 }}>
          <ParameterRowEditor row={row} />
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧩 Parameter memory page verlinken ..."
cat > app/parameter-memory/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function ParameterMemoryPage() {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Parameter</span> & Lernbasis</h1>
        <p className="sub">Gespeicherte regionale Parameter wie Stundenpreis, Fahrkosten oder Spezifikationswerte.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Geschäftsfeld</th>
                <th>Typ</th>
                <th>Key</th>
                <th>Wert</th>
                <th>Status</th>
                <th>Bearbeiten</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.parameterType}</td>
                  <td>{row.parameterKey}</td>
                  <td>{row.value ?? "-"}</td>
                  <td>{row.status}</td>
                  <td><Link className="linkish" href={`/parameter-memory/${row.id}`}>Öffnen</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧩 Opportunity detail um Lernblock erweitern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/opportunities/[id]/page.tsx")
text = p.read_text()

if 'OpportunityLearningForm' not in text:
    text = text.replace(
        'import OpportunityEditor from "@/components/forms/OpportunityEditor";',
        'import OpportunityEditor from "@/components/forms/OpportunityEditor";\nimport OpportunityLearningForm from "@/components/forms/OpportunityLearningForm";'
    )

    text = text.replace(
        '</div>\n        </div>\n      </div>\n    </div>\n  );',
        '''</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Lernfeedback & Parameter</div>
        <div className="meta" style={{ marginTop: 10, marginBottom: 14 }}>
          Bestätigte Werte aus realer Bearbeitung können als regionale Lernbasis für künftige Ausschreibungen gespeichert werden.
        </div>
        <OpportunityLearningForm opportunity={opportunity} />
      </div>
    </div>
  );'''
    )

p.write_text(text)
PY

echo "🧩 Source hit detail um fehlende Parameter ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/source-hits/[id]/page.tsx")
text = p.read_text()

if 'Extrahierte Spezifikationen' not in text:
    text = text.replace(
        '</div>\n      </div>\n\n      <div className="card">',
        '''</div>
      </div>

      <div className="card">
        <div className="section-title">Extrahierte Spezifikationen</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 14 }}>{JSON.stringify(hit.extractedSpecs || {}, null, 2)}</pre>
      </div>

      <div className="card">'''
    )

p.write_text(text)
PY

npm run build || true
git add lib/parameterLearning.ts app/api/parameter-memory/[id]/route.ts app/api/opportunities/[id]/learn/route.ts components/forms/ParameterRowEditor.tsx components/forms/OpportunityLearningForm.tsx app/parameter-memory/[id]/page.tsx app/parameter-memory/page.tsx app/opportunities/[id]/page.tsx app/source-hits/[id]/page.tsx
git commit -m "feat: add editable parameter memory and opportunity learning feedback workflow" || true
git push origin main || true

echo "✅ Parameter Memory + Opportunity Learning Slice eingebaut."
