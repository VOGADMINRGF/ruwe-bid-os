#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Workbench Activation Slice"

mkdir -p app/missing-variables/[id]
mkdir -p app/api/missing-variables/[id]/answer
mkdir -p components/forms
mkdir -p lib

echo "🧠 Region normalization hardening ..."
cat > lib/regionNormalization.ts <<'TS'
import { toPlain } from "@/lib/serializers";

function s(v: any) {
  return String(v || "").trim();
}

export function normalizeRegionLabel(input: any) {
  const raw = s(input).toLowerCase();
  if (!raw) return "Sonstige";

  if (raw.includes("berlin")) return "Berlin";
  if (raw.includes("magdeburg")) return "Magdeburg";
  if (raw.includes("schkeuditz") || raw.includes("leipzig")) return "Leipzig / Schkeuditz";
  if (raw.includes("zeitz")) return "Zeitz";
  if (raw.includes("potsdam") || raw.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (raw.includes("brandenburg")) return "Brandenburg";
  if (raw.includes("halle") || raw.includes("stendal") || raw.includes("dessau") || raw.includes("merseburg") || raw.includes("bismark")) return "Sachsen-Anhalt";
  if (raw.includes("jena") || raw.includes("weimar") || raw.includes("erfurt") || raw.includes("ilm")) return "Thüringen";
  if (raw.includes("online")) return "Online";

  return "Sonstige";
}

export function normalizeRegionFromHit(hit: any) {
  const candidates = [
    hit?.region,
    hit?.city,
    hit?.postalCode,
    hit?.title,
    hit?.url
  ].filter(Boolean);

  for (const c of candidates) {
    const n = normalizeRegionLabel(c);
    if (n !== "Sonstige") return n;
  }

  return "Sonstige";
}

export function buildRegionDebug(hit: any) {
  return toPlain([
    String(hit?.region || ""),
    String(hit?.city || ""),
    String(hit?.postalCode || ""),
    String(hit?.title || "")
  ]);
}
TS

echo "🧠 Assignment hardening ..."
cat > lib/assignmentEngine.ts <<'TS'
import { toPlain } from "@/lib/serializers";

const COORDINATORS = [
  {
    id: "coord_berlin",
    name: "Koordinator Berlin",
    regions: ["Berlin"],
    trades: ["Reinigung", "Glasreinigung", "Hausmeister"]
  },
  {
    id: "coord_brandenburg",
    name: "Koordinator Brandenburg",
    regions: ["Brandenburg", "Potsdam / Stahnsdorf"],
    trades: ["Reinigung", "Grünpflege"]
  },
  {
    id: "coord_magdeburg",
    name: "Koordinator Magdeburg",
    regions: ["Magdeburg", "Sachsen-Anhalt"],
    trades: ["Sicherheit", "Reinigung", "Hausmeister", "Grünpflege"]
  },
  {
    id: "coord_sachsen",
    name: "Koordinator Sachsen",
    regions: ["Leipzig / Schkeuditz", "Zeitz", "Thüringen"],
    trades: ["Winterdienst", "Reinigung", "Hausmeister", "Grünpflege"]
  }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

export function assignOpportunity(opportunity: any) {
  const exact =
    COORDINATORS.find((x) =>
      x.regions.includes(opportunity.region) && x.trades.includes(opportunity.trade)
    ) ||
    COORDINATORS.find((x) => x.regions.includes(opportunity.region)) ||
    COORDINATORS.find((x) => x.trades.includes(opportunity.trade)) ||
    COORDINATORS[0];

  const support =
    opportunity.calcMode === "unklar" || !opportunity.estimatedValue
      ? ASSISTS[0]
      : ASSISTS[1];

  return toPlain({
    ownerId: exact.id,
    ownerName: exact.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
TS

echo "🧠 Missing variable detail helpers ..."
cat > lib/missingVariableDetail.ts <<'TS'
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function getMissingVariableDetail(id: string) {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const params = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const variable = rows.find((x: any) => x.id === id);
  if (!variable) return null;

  const opportunity = opps.find((x: any) => x.id === variable.opportunityId) || null;
  const matchingParams = params.filter((x: any) =>
    x?.type === variable.type ||
    (variable.region && x?.region === variable.region) ||
    (variable.trade && x?.trade === variable.trade)
  );

  return toPlain({
    variable,
    opportunity,
    matchingParams
  });
}
TS

echo "🧩 API for answering missing vars ..."
cat > app/api/missing-variables/[id]/answer/route.ts <<'TS'
import { NextResponse } from "next/server";
import { closeMissingVariableWithParameter } from "@/lib/missingVariablesWorkflow";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const result = await closeMissingVariableWithParameter(id, body.value, body.status || "defined");
  await rebuildOpportunities();

  return NextResponse.json({
    ok: true,
    result
  });
}
TS

echo "🧩 Missing variable answer form ..."
cat > components/forms/MissingVariableAnswerForm.tsx <<'TSX'
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
TSX

echo "🧩 Missing variable detail page ..."
cat > app/missing-variables/[id]/page.tsx <<'TSX'
import Link from "next/link";
import { getMissingVariableDetail } from "@/lib/missingVariableDetail";
import MissingVariableAnswerForm from "@/components/forms/MissingVariableAnswerForm";

export default async function MissingVariableDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const detail = await getMissingVariableDetail(id);

  if (!detail) {
    return (
      <div className="stack">
        <h1 className="h1">Variable nicht gefunden</h1>
      </div>
    );
  }

  const v = detail.variable;
  const opp = detail.opportunity;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variable</h1>
        <p className="sub">Gezielte Beantwortung offener Kalkulations- und Ausschreibungsparameter.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Variable</div>
          <div className="meta" style={{ marginTop: 14 }}>Frage: {v.question}</div>
          <div className="meta">Typ: {v.type}</div>
          <div className="meta">Region: {v.region}</div>
          <div className="meta">Gewerk: {v.trade}</div>
          <div className="meta">Priorität: {v.priority}</div>
          <div className="meta">Status: {v.status || "offen"}</div>
          <div className="meta">Owner: {v.ownerId || "-"}</div>
        </div>

        <MissingVariableAnswerForm id={v.id} question={v.question} />
      </div>

      {opp ? (
        <div className="card">
          <div className="section-title">Zugehörige Opportunity</div>
          <div className="meta" style={{ marginTop: 14 }}>
            <Link className="linkish" href={`/opportunities/${encodeURIComponent(opp.id)}`}>
              {opp.title}
            </Link>
          </div>
          <div className="meta">Region: {opp.region}</div>
          <div className="meta">Gewerk: {opp.trade}</div>
          <div className="meta">Entscheidung: {opp.decision}</div>
          <div className="meta">Kalkulationsmodus: {opp.calcMode}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="section-title">Ähnliche Parameter</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Wert</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(detail.matchingParams || []).map((x: any, i: number) => (
                <tr key={x.id || i}>
                  <td>{x.type}</td>
                  <td>{x.region || "-"}</td>
                  <td>{x.trade || "-"}</td>
                  <td>{x.value ?? "-"}</td>
                  <td>{x.status || "-"}</td>
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

echo "🧩 Make missing variables clickable ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/missing-variables/page.tsx")
text = p.read_text()

if 'import Link from "next/link";' not in text:
    text = text.replace('import { readStore } from "@/lib/storage";', 'import { readStore } from "@/lib/storage";\nimport Link from "next/link";')

text = text.replace(
    '<td>{x.question}</td>',
    '<td><Link className="linkish" href={`/missing-variables/${encodeURIComponent(x.id)}`}>{x.question}</Link></td>'
)

p.write_text(text)
print("Missing variables list linked")
PY

echo "🧩 Rebuild opportunities to apply new assignment ..."
cat > app/api/opportunities/rebuild/route.ts <<'TS'
import { NextResponse } from "next/server";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function GET() {
  return NextResponse.json(await rebuildOpportunities());
}
TS

npm run build || true
git add lib/regionNormalization.ts lib/assignmentEngine.ts lib/missingVariableDetail.ts app/api/missing-variables/[id]/answer/route.ts app/missing-variables/[id]/page.tsx components/forms/MissingVariableAnswerForm.tsx app/missing-variables/page.tsx app/api/opportunities/rebuild/route.ts
git commit -m "feat: activate missing variable workflow and harden assignment routing" || true
git push origin main || true

echo "✅ Workbench Activation Slice eingebaut."
