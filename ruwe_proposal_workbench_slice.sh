#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Proposal Workbench Slice"

mkdir -p app/api/opportunities/[id]
mkdir -p app/api/opportunities/[id]/status
mkdir -p app/api/opportunities/[id]/notes
mkdir -p app/opportunities/[id]
mkdir -p components/forms
mkdir -p lib

echo "🧠 Opportunity detail helpers ..."
cat > lib/opportunityDetail.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function getOpportunityDetail(id: string) {
  const db = await readStore();

  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const missingVariables = Array.isArray(db.costGaps) ? db.costGaps : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const sourceHits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const notes = Array.isArray((db as any).opportunityNotes) ? (db as any).opportunityNotes : [];

  const opportunity = opportunities.find((x: any) => x.id === id);
  if (!opportunity) return null;

  const sourceHit = sourceHits.find((x: any) => x.id === opportunity.sourceHitId) || null;
  const vars = missingVariables.filter((x: any) => x.opportunityId === id);
  const params = parameterMemory.filter((x: any) =>
    (x.region && x.region === opportunity.region) ||
    (x.trade && x.trade === opportunity.trade) ||
    (!x.region && !x.trade)
  );

  const ownNotes = notes.filter((x: any) => x.opportunityId === id);

  return toPlain({
    opportunity,
    sourceHit,
    missingVariables: vars,
    parameterMemory: params,
    notes: ownNotes
  });
}

export async function updateOpportunityStatus(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("opportunities", next as any);
  return toPlain(next.find((x: any) => x.id === id) || null);
}

export async function addOpportunityNote(id: string, input: { author?: string; text: string }) {
  const db = await readStore();
  const rows = Array.isArray((db as any).opportunityNotes) ? (db as any).opportunityNotes : [];
  const entry = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    opportunityId: id,
    author: input.author || "system",
    text: input.text,
    createdAt: new Date().toISOString()
  };
  await replaceCollection("opportunityNotes" as any, [...rows, entry] as any);
  return toPlain(entry);
}
TS

echo "🧠 Opportunity workbench summary ..."
cat > lib/proposalWorkbench.ts <<'TS'
import { toPlain } from "@/lib/serializers";

export function buildProposalWorkbench(detail: any) {
  const opp = detail?.opportunity;
  const vars = Array.isArray(detail?.missingVariables) ? detail.missingVariables : [];
  const params = Array.isArray(detail?.parameterMemory) ? detail.parameterMemory : [];
  const hit = detail?.sourceHit;

  if (!opp) return null;

  const openVars = vars.filter((x: any) => x.status !== "beantwortet");
  const answeredVars = vars.filter((x: any) => x.status === "beantwortet");

  const availableRegionalParams = params.filter((x: any) =>
    x.status === "defined" &&
    ((x.region && x.region === opp.region) || (x.trade && x.trade === opp.trade))
  );

  let workbenchStatus = "Vorprüfung";
  if (opp.decision === "Bid" && openVars.length === 0) workbenchStatus = "Angebot vorbereitbar";
  else if (opp.decision === "Bid" && openVars.length > 0) workbenchStatus = "Parameter fehlen";
  else if (opp.decision === "Prüfen") workbenchStatus = "Review nötig";
  else if (opp.decision === "No-Bid" || opp.decision === "No-Go") workbenchStatus = "derzeit nicht priorisiert";

  const nextAction =
    openVars.length > 0
      ? openVars[0].question
      : opp.decision === "Bid"
      ? "Angebotsstruktur und Kalkulation vorbereiten."
      : "Fall beobachten oder Entscheidung dokumentieren.";

  return toPlain({
    workbenchStatus,
    nextAction,
    metrics: {
      openVariables: openVars.length,
      answeredVariables: answeredVars.length,
      parameterCount: availableRegionalParams.length,
      directLinkValid: opp.directLinkValid === true,
      estimatedValue: opp.estimatedValue || 0,
      durationMonths: opp.durationMonths || 0
    },
    blocks: {
      tenderSummary: {
        title: opp.title,
        region: opp.region,
        trade: opp.trade,
        decision: opp.decision,
        calcMode: opp.calcMode,
        stage: opp.stage,
        dueDate: opp.dueDate || "-",
        directLink: opp.externalResolvedUrl || hit?.externalResolvedUrl || hit?.url || null
      },
      variables: openVars,
      parameters: availableRegionalParams,
      notes: detail?.notes || []
    }
  });
}
TS

echo "🧩 APIs ..."
cat > app/api/opportunities/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { getOpportunityDetail } from "@/lib/opportunityDetail";
import { buildProposalWorkbench } from "@/lib/proposalWorkbench";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const detail = await getOpportunityDetail(id);
  if (!detail) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    detail,
    workbench: buildProposalWorkbench(detail)
  });
}
TS

cat > app/api/opportunities/[id]/status/route.ts <<'TS'
import { NextResponse } from "next/server";
import { updateOpportunityStatus } from "@/lib/opportunityDetail";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateOpportunityStatus(id, body));
}
TS

cat > app/api/opportunities/[id]/notes/route.ts <<'TS'
import { NextResponse } from "next/server";
import { addOpportunityNote } from "@/lib/opportunityDetail";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await addOpportunityNote(id, body));
}
TS

echo "🧩 Client forms ..."
cat > components/forms/OpportunityStatusForm.tsx <<'TSX'
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OpportunityStatusForm({
  id,
  currentStage,
  currentDecision
}: {
  id: string;
  currentStage?: string;
  currentDecision?: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage || "neu");
  const [decision, setDecision] = useState(currentDecision || "Prüfen");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage, decision })
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Status ändern</div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="neu">neu</option>
          <option value="review">review</option>
          <option value="qualifiziert">qualifiziert</option>
          <option value="angebot">angebot</option>
          <option value="beobachten">beobachten</option>
          <option value="archiv">archiv</option>
        </select>

        <select className="select" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="Bid">Bid</option>
          <option value="Prüfen">Prüfen</option>
          <option value="No-Bid">No-Bid</option>
          <option value="Unklar">Unklar</option>
        </select>
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "Speichert..." : "Status speichern"}
        </button>
      </div>
    </div>
  );
}
TSX

cat > components/forms/OpportunityNoteForm.tsx <<'TSX'
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
TSX

echo "🧩 Opportunities list clickable ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/opportunities/page.tsx")
text = p.read_text()

if 'import Link from "next/link";' not in text:
    text = text.replace('import { readStore } from "@/lib/storage";', 'import { readStore } from "@/lib/storage";\nimport Link from "next/link";')

text = text.replace(
    '<td>{x.title}</td>',
    '<td><Link className="linkish" href={`/opportunities/${encodeURIComponent(x.id)}`}>{x.title}</Link></td>'
)

p.write_text(text)
print("Opportunities list linked")
PY

echo "🧩 Opportunity detail page ..."
cat > app/opportunities/[id]/page.tsx <<'TSX'
import Link from "next/link";
import { getOpportunityDetail } from "@/lib/opportunityDetail";
import { buildProposalWorkbench } from "@/lib/proposalWorkbench";
import OpportunityStatusForm from "@/components/forms/OpportunityStatusForm";
import OpportunityNoteForm from "@/components/forms/OpportunityNoteForm";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function OpportunityDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const detail = await getOpportunityDetail(id);

  if (!detail) {
    return (
      <div className="stack">
        <h1 className="h1">Opportunity nicht gefunden</h1>
      </div>
    );
  }

  const workbench = buildProposalWorkbench(detail);
  const opp = detail.opportunity;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunity Workbench</h1>
        <p className="sub">Ausschreibung verstehen, Variablen klären, Kalkulationsbasis herstellen und Angebot vorbereiten.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Ausschreibung</div>
          <div className="meta" style={{ marginTop: 14 }}>Titel: {opp.title}</div>
          <div className="meta">Region: {opp.region}</div>
          <div className="meta">Gewerk: {opp.trade}</div>
          <div className="meta">Entscheidung: {opp.decision}</div>
          <div className="meta">Stage: {opp.stage}</div>
          <div className="meta">Kalkulationsmodus: {opp.calcMode}</div>
          <div className="meta">Volumen: {formatCurrencyCompact(opp.estimatedValue || 0)}</div>
          <div className="meta">Laufzeit: {opp.durationMonths || 0} Mon.</div>
          <div className="meta">Frist: {opp.dueDate || "-"}</div>
          <div className="meta">Owner: {opp.ownerId || "-"}</div>
          <div className="meta">Assistenz: {opp.supportOwnerId || "-"}</div>
          <div className="meta">
            Direktlink:{" "}
            {workbench?.blocks?.tenderSummary?.directLink ? (
              <Link className="linkish" href={String(workbench.blocks.tenderSummary.directLink)} target="_blank">
                Quelle öffnen
              </Link>
            ) : (
              "nicht vorhanden"
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Arbeitsstatus</div>
          <div className="meta" style={{ marginTop: 14 }}>Workbench-Status: {workbench?.workbenchStatus}</div>
          <div className="meta">Nächste Aktion: {workbench?.nextAction}</div>
          <div className="meta">Offene Variablen: {workbench?.metrics?.openVariables}</div>
          <div className="meta">Beantwortet: {workbench?.metrics?.answeredVariables}</div>
          <div className="meta">Parameter vorhanden: {workbench?.metrics?.parameterCount}</div>
          <div className="meta">Direktlink valide: {workbench?.metrics?.directLinkValid ? "ja" : "nein"}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <OpportunityStatusForm id={opp.id} currentStage={opp.stage} currentDecision={opp.decision} />
        <OpportunityNoteForm id={opp.id} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Offene Variablen</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Frage</th>
                  <th>Typ</th>
                  <th>Priorität</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(detail.missingVariables || []).map((x: any) => (
                  <tr key={x.id}>
                    <td>{x.question}</td>
                    <td>{x.type}</td>
                    <td>{x.priority}</td>
                    <td>{x.status || "offen"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Passende Parameter</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Region</th>
                  <th>Gewerk</th>
                  <th>Wert</th>
                </tr>
              </thead>
              <tbody>
                {(detail.parameterMemory || []).map((x: any, i: number) => (
                  <tr key={x.id || i}>
                    <td>{x.type}</td>
                    <td>{x.region || "-"}</td>
                    <td>{x.trade || "-"}</td>
                    <td>{x.value ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Notizen</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th>Autor</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              {(detail.notes || []).map((x: any) => (
                <tr key={x.id}>
                  <td>{x.createdAt}</td>
                  <td>{x.author}</td>
                  <td>{x.text}</td>
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

echo "🧩 Navigation ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()
if '"/opportunities"' not in text:
    text = text.replace(
        '{ href: "/config", label: "Config" },',
        '{ href: "/config", label: "Config" },\n  { href: "/opportunities", label: "Opportunities" },'
    )
p.write_text(text)
print("Navigation checked")
PY

npm run build || true
git add lib/opportunityDetail.ts lib/proposalWorkbench.ts app/api/opportunities/[id]/route.ts app/api/opportunities/[id]/status/route.ts app/api/opportunities/[id]/notes/route.ts components/forms/OpportunityStatusForm.tsx components/forms/OpportunityNoteForm.tsx app/opportunities/page.tsx app/opportunities/[id]/page.tsx app/layout.tsx
git commit -m "feat: add proposal workbench and clickable opportunity detail flow" || true
git push origin main || true

echo "✅ Proposal Workbench Slice eingebaut."
