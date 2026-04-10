#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Fit Score + Learning + UI Hardening"

mkdir -p lib
mkdir -p app/api/opportunities/[id]/override
mkdir -p app/api/learning-rules
mkdir -p app/learning-rules
mkdir -p components/forms

echo "🧠 Fit score + rationale ..."
cat > lib/fitScoring.ts <<'TS'
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

const CORE_REGIONS = [
  "Berlin",
  "Magdeburg",
  "Potsdam / Stahnsdorf",
  "Leipzig / Schkeuditz",
  "Zeitz",
  "Brandenburg",
  "Sachsen-Anhalt",
  "Thüringen"
];

export async function scoreOpportunityFit(opportunity: any) {
  const db = await readStore();
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];
  const learningRules = Array.isArray((db as any).learningRules) ? (db as any).learningRules : [];

  let score = 0;
  const reasons: string[] = [];

  const region = String(opportunity?.region || "");
  const trade = String(opportunity?.trade || "");
  const decision = String(opportunity?.decision || "");

  const matchingRules = rules.filter((x: any) =>
    x?.enabled !== false &&
    String(x?.trade || "") === trade
  );

  if (CORE_REGIONS.includes(region)) {
    score += 20;
    reasons.push(`Region ${region} liegt im relevanten Zielraum.`);
  } else {
    score -= 35;
    reasons.push(`Region ${region || "unbekannt"} liegt aktuell außerhalb des primären Fokusraums.`);
  }

  if (matchingRules.length > 0) {
    score += 25;
    reasons.push(`Für ${trade} existiert bereits aktive Standort-/Gewerkelogik.`);
  } else {
    score -= 20;
    reasons.push(`Für ${trade} ist derzeit keine belastbare Betriebslogik hinterlegt.`);
  }

  if (opportunity?.directLinkValid === true) {
    score += 10;
  } else {
    score -= 10;
    reasons.push("Es fehlt ein belastbarer Direktlink.");
  }

  if (n(opportunity?.estimatedValue) > 0) {
    score += 10;
  } else {
    score -= 8;
    reasons.push("Das Volumen ist derzeit nicht belastbar kalkulierbar.");
  }

  if (opportunity?.calcMode && opportunity.calcMode !== "unklar") {
    score += 10;
  } else {
    score -= 10;
    reasons.push("Der Kalkulationsmodus ist noch unklar.");
  }

  if (decision === "Bid") score += 15;
  if (decision === "Prüfen") score += 5;
  if (decision === "No-Go" || decision === "No-Bid") score -= 5;

  const similarLearning = learningRules.filter((x: any) =>
    (x?.trade ? x.trade === trade : true) &&
    (x?.region ? x.region === region : true)
  );

  if (similarLearning.some((x: any) => x?.action === "promote_bid")) {
    score += 20;
    reasons.push("Eine gespeicherte Lernregel spricht für Freigabe ähnlicher Fälle.");
  }

  if (similarLearning.some((x: any) => x?.action === "demote_no_bid")) {
    score -= 20;
    reasons.push("Eine gespeicherte Lernregel spricht gegen ähnliche Fälle.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score + 50));

  let bucket = "Prüfen";
  if (normalizedScore >= 70) bucket = "Fit";
  else if (normalizedScore < 35) bucket = "No-Fit";

  return toPlain({
    score: normalizedScore,
    bucket,
    shortReason:
      bucket === "Fit"
        ? "Passt regional und operativ grundsätzlich gut ins aktuelle Such- und Angebotsbild."
        : bucket === "No-Fit"
        ? "Fällt derzeit aus Fokusraum, Betriebslogik oder Kalkulationsqualität heraus."
        : "Ist nicht ausgeschlossen, braucht aber noch operative oder kalkulatorische Klärung.",
    detailedReasons: reasons.slice(0, 5)
  });
}
TS

echo "🧠 Learning rules ..."
cat > lib/learningRules.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listLearningRules() {
  const db = await readStore();
  return toPlain(Array.isArray((db as any).learningRules) ? (db as any).learningRules : []);
}

export async function addLearningRule(input: any) {
  const db = await readStore();
  const rows = Array.isArray((db as any).learningRules) ? (db as any).learningRules : [];

  const entry = {
    id: `lr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    trade: input.trade || null,
    region: input.region || null,
    action: input.action || "promote_bid",
    reason: input.reason || "",
    createdAt: new Date().toISOString()
  };

  await replaceCollection("learningRules" as any, [...rows, entry] as any);
  return toPlain(entry);
}
TS

echo "🧠 Opportunity enrichment with fit/rationale ..."
cat > lib/opportunityEnrichment.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { scoreOpportunityFit } from "@/lib/fitScoring";
import { toPlain } from "@/lib/serializers";

export async function enrichOpportunitiesWithFit() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  const next = [];
  for (const row of rows) {
    const fit = await scoreOpportunityFit(row);

    const noBidReason =
      row.decision === "No-Go" || row.decision === "No-Bid"
        ? `${fit.shortReason} ${fit.detailedReasons.slice(0, 1).join(" ")}`
        : row.noBidReason || "";

    next.push({
      ...row,
      fitScore: fit.score,
      fitBucket: fit.bucket,
      fitReasonShort: fit.shortReason,
      fitReasonList: fit.detailedReasons,
      noBidReason
    });
  }

  await replaceCollection("opportunities", toPlain(next) as any);
  return toPlain({ changed: next.length });
}
TS

echo "🧠 Opportunity overrides ..."
cat > lib/opportunityOverrides.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";
import { addLearningRule } from "@/lib/learningRules";

export async function overrideOpportunity(id: string, body: any) {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  let updated: any = null;
  const next = rows.map((x: any) => {
    if (x.id !== id) return x;
    updated = {
      ...x,
      decision: body.decision || x.decision,
      overrideReason: body.reason || "",
      overrideAt: new Date().toISOString(),
      overrideBy: body.by || "admin"
    };
    return updated;
  });

  await replaceCollection("opportunities", next as any);

  if (updated && body.learn === true) {
    await addLearningRule({
      trade: updated.trade,
      region: updated.region,
      action: body.decision === "Bid" ? "promote_bid" : "demote_no_bid",
      reason: body.reason || `Aus Override für ${updated.title}`
    });
  }

  return toPlain(updated);
}
TS

echo "🧩 APIs ..."
cat > app/api/opportunities/[id]/override/route.ts <<'TS'
import { NextResponse } from "next/server";
import { overrideOpportunity } from "@/lib/opportunityOverrides";
import { enrichOpportunitiesWithFit } from "@/lib/opportunityEnrichment";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const result = await overrideOpportunity(id, body);
  await enrichOpportunitiesWithFit();

  return NextResponse.json({ ok: true, result });
}
TS

cat > app/api/learning-rules/route.ts <<'TS'
import { NextResponse } from "next/server";
import { addLearningRule, listLearningRules } from "@/lib/learningRules";

export async function GET() {
  return NextResponse.json(await listLearningRules());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await addLearningRule(body));
}
TS

echo "🧩 Override form ..."
cat > components/forms/OpportunityOverrideForm.tsx <<'TSX'
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpportunityOverrideForm({
  id,
  currentDecision
}: {
  id: string;
  currentDecision?: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState(currentDecision || "Prüfen");
  const [reason, setReason] = useState("");
  const [learn, setLearn] = useState(true);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${id}/override`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reason,
          learn,
          by: "admin"
        })
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">KI-Entscheidung korrigieren</div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <select className="select" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="Bid">Bid</option>
          <option value="Prüfen">Prüfen</option>
          <option value="No-Bid">No-Bid</option>
          <option value="No-Go">No-Go</option>
        </select>
        <label className="meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={learn} onChange={(e) => setLearn(e.target.checked)} />
          Für ähnliche Fälle lernen
        </label>
      </div>

      <textarea
        className="input"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Kurz begründen, warum die KI hier falsch oder unvollständig lag ..."
        style={{ marginTop: 14, minHeight: 110 }}
      />

      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Korrektur speichern"}
        </button>
      </div>
    </div>
  );
}
TSX

echo "🧩 Learning rules page ..."
cat > app/learning-rules/page.tsx <<'TSX'
import { listLearningRules } from "@/lib/learningRules";

export default async function LearningRulesPage() {
  const rows = await listLearningRules();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Learning Rules</h1>
        <p className="sub">Gespeicherte Freigabe- und Blockerlogik für ähnliche Angebote.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Aktion</th>
                <th>Grund</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.region || "-"}</td>
                  <td>{x.trade || "-"}</td>
                  <td>{x.action}</td>
                  <td>{x.reason || "-"}</td>
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

echo "🧩 Opportunities prettier + sortable ..."
cat > app/opportunities/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import Link from "next/link";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams?: Promise<{ sort?: string }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "fit";

  const db = await readStore();
  let rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "decision") return String(a.decision || "").localeCompare(String(b.decision || ""));
    if (sort === "volume") return n(b.estimatedValue) - n(a.estimatedValue);
    return n(b.fitScore) - n(a.fitScore);
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunities</h1>
        <p className="sub">Normierte Ausschreibungsobjekte mit Priorisierung, Fit-Logik und offener Variablenlage.</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/opportunities?sort=fit">Sortierung: Fit</Link>
          <Link className="button button-secondary" href="/opportunities?sort=volume">Volumen</Link>
          <Link className="button button-secondary" href="/opportunities?sort=region">Region</Link>
          <Link className="button button-secondary" href="/opportunities?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/opportunities?sort=decision">Entscheidung</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Fit</th>
                <th>Entscheidung</th>
                <th>Kalkulationsmodus</th>
                <th>Offene Variablen</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>
                    <Link className="linkish" href={`/opportunities/${encodeURIComponent(x.id)}`}>
                      {x.title}
                    </Link>
                    {x.decision === "No-Go" || x.decision === "No-Bid" ? (
                      <div className="meta" style={{ marginTop: 6 }}>
                        {x.noBidReason || x.fitReasonShort || "Der Fall passt derzeit operativ nicht ausreichend ins Zielbild."}
                      </div>
                    ) : null}
                  </td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.fitScore ?? "-"}</td>
                  <td>{x.decision}</td>
                  <td>{x.calcMode}</td>
                  <td>{x.missingVariableCount}</td>
                  <td>{x.ownerId}</td>
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

echo "🧩 Missing variables prettier + sortable ..."
cat > app/missing-variables/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import Link from "next/link";

export default async function MissingVariablesPage({
  searchParams
}: {
  searchParams?: Promise<{ sort?: string }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "priority";

  const db = await readStore();
  let rows = Array.isArray(db.costGaps) ? db.costGaps : [];

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "owner") return String(a.ownerId || "").localeCompare(String(b.ownerId || ""));
    const prio = { hoch: 3, mittel: 2, niedrig: 1 } as Record<string, number>;
    return (prio[b.priority || "niedrig"] || 0) - (prio[a.priority || "niedrig"] || 0);
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Stunden, Fläche, Frist, Linkvalidität und regionale Standardsätze.</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/missing-variables?sort=priority">Priorität</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=region">Region</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=owner">Owner</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Frage</th>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>
                    <Link className="linkish" href={`/missing-variables/${encodeURIComponent(x.id)}`}>
                      {x.question}
                    </Link>
                  </td>
                  <td>{x.type}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.priority}</td>
                  <td>{x.ownerId || "-"}</td>
                  <td>{x.status || "offen"}</td>
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

echo "🧩 Opportunity detail page enhance ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/opportunities/[id]/page.tsx")
text = p.read_text()

if 'import OpportunityOverrideForm from "@/components/forms/OpportunityOverrideForm";' not in text:
    text = text.replace(
        'import OpportunityNoteForm from "@/components/forms/OpportunityNoteForm";',
        'import OpportunityNoteForm from "@/components/forms/OpportunityNoteForm";\nimport OpportunityOverrideForm from "@/components/forms/OpportunityOverrideForm";'
    )

text = text.replace(
    '<div className="grid grid-2">\n        <OpportunityStatusForm id={opp.id} currentStage={opp.stage} currentDecision={opp.decision} />\n        <OpportunityNoteForm id={opp.id} />\n      </div>',
    '<div className="grid grid-3">\n        <OpportunityStatusForm id={opp.id} currentStage={opp.stage} currentDecision={opp.decision} />\n        <OpportunityOverrideForm id={opp.id} currentDecision={opp.decision} />\n        <OpportunityNoteForm id={opp.id} />\n      </div>'
)

text = text.replace(
    '<div className="meta">Direktlink valide: {workbench?.metrics?.directLinkValid ? "ja" : "nein"}</div>',
    '<div className="meta">Direktlink valide: {workbench?.metrics?.directLinkValid ? "ja" : "nein"}</div>\n          <div className="meta">Fit-Score: {opp.fitScore ?? "-"}</div>\n          <div className="meta">Fit-Einschätzung: {opp.fitReasonShort || "-"}</div>'
)

p.write_text(text)
print("Opportunity detail enhanced")
PY

echo "🧩 Navigation ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()
if '"/learning-rules"' not in text:
    text = text.replace(
        '{ href: "/owner-workload", label: "Owner-Last" },',
        '{ href: "/owner-workload", label: "Owner-Last" },\n  { href: "/learning-rules", label: "Learning" },'
    )
p.write_text(text)
print("Navigation updated")
PY

echo "🧩 Enrichment API ..."
mkdir -p app/api/opportunities/enrich-fit
cat > app/api/opportunities/enrich-fit/route.ts <<'TS'
import { NextResponse } from "next/server";
import { enrichOpportunitiesWithFit } from "@/lib/opportunityEnrichment";

export async function GET() {
  return NextResponse.json(await enrichOpportunitiesWithFit());
}
TS

npm run build || true
git add lib/fitScoring.ts lib/learningRules.ts lib/opportunityEnrichment.ts lib/opportunityOverrides.ts app/api/opportunities/[id]/override/route.ts app/api/learning-rules/route.ts components/forms/OpportunityOverrideForm.tsx app/learning-rules/page.tsx app/opportunities/page.tsx app/missing-variables/page.tsx app/opportunities/[id]/page.tsx app/layout.tsx app/api/opportunities/enrich-fit/route.ts
git commit -m "feat: add fit scoring, learning rules, sortable worklists and no-bid rationale" || true
git push origin main || true

echo "✅ Fit + Learning Slice eingebaut."
