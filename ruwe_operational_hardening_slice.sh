#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Operational Hardening Slice"

mkdir -p lib
mkdir -p app/api/ops/run-operational-hardening
mkdir -p app/api/missing-variables/[id]
mkdir -p app/api/dashboard/owner-workload
mkdir -p app/owner-workload
mkdir -p components/dashboard

echo "🧠 Live query presets ..."
cat > lib/liveQueryPresets.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

const DEFAULT_PRESETS = [
  { id: "preset_winterdienst_berlin", label: "Winterdienst Berlin", sourceId: "src_service_bund", query: "Winterdienst Berlin", active: true },
  { id: "preset_reinigung_magdeburg", label: "Reinigung Magdeburg", sourceId: "src_service_bund", query: "Reinigung Magdeburg", active: true },
  { id: "preset_gruenpflege_potsdam", label: "Grünpflege Potsdam", sourceId: "src_service_bund", query: "Grünpflege Potsdam", active: true },
  { id: "preset_sicherheit_berlin", label: "Sicherheit Berlin", sourceId: "src_service_bund", query: "Sicherheit Berlin", active: true },
  { id: "preset_hausmeister_leipzig", label: "Hausmeister Leipzig", sourceId: "src_service_bund", query: "Hausmeister Leipzig", active: true }
];

export async function ensureLiveQueryPresets() {
  const db = await readStore();
  const rows = Array.isArray(db.liveQueryPresets) ? db.liveQueryPresets : [];
  if (rows.length) return toPlain(rows);

  await replaceCollection("liveQueryPresets" as any, DEFAULT_PRESETS as any);
  return toPlain(DEFAULT_PRESETS);
}

export async function listLiveQueryPresets() {
  await ensureLiveQueryPresets();
  const db = await readStore();
  return toPlain(Array.isArray(db.liveQueryPresets) ? db.liveQueryPresets : []);
}
TS

echo "🧠 Missing variables workflow ..."
cat > lib/missingVariablesWorkflow.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listMissingVariables() {
  const db = await readStore();
  return toPlain(Array.isArray(db.costGaps) ? db.costGaps : []);
}

export async function updateMissingVariable(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );
  await replaceCollection("costGaps", next);
  return toPlain(next.find((x: any) => x.id === id) || null);
}

export async function closeMissingVariableWithParameter(id: string, value: any, status = "defined") {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const row = rows.find((x: any) => x.id === id);
  if (!row) return null;

  const parameterRows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const nextParam = {
    id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: row.type,
    region: row.region || null,
    trade: row.trade || null,
    parameterKey: row.type,
    value,
    status,
    source: "admin_answer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const nextRows = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          status: "beantwortet",
          answeredValue: value,
          answeredAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("parameterMemory", [...parameterRows, nextParam]);
  await replaceCollection("costGaps", nextRows);

  return toPlain({
    variable: nextRows.find((x: any) => x.id === id),
    parameter: nextParam
  });
}
TS

echo "🧠 Owner workload aggregation ..."
cat > lib/ownerWorkload.ts <<'TS'
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

const OWNER_LABELS: Record<string, string> = {
  coord_berlin: "Koordinator Berlin",
  coord_brandenburg: "Koordinator Brandenburg",
  coord_magdeburg: "Koordinator Magdeburg",
  coord_sachsen: "Koordinator Sachsen",
  assist_docs: "Assistenz Dokumente",
  assist_calc: "Assistenz Kalkulation"
};

export async function buildOwnerWorkload() {
  const db = await readStore();
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const vars = Array.isArray(db.costGaps) ? db.costGaps : [];

  const owners = new Set<string>();
  for (const x of opps) {
    if (x.ownerId) owners.add(x.ownerId);
    if (x.supportOwnerId) owners.add(x.supportOwnerId);
  }
  for (const x of vars) {
    if (x.ownerId) owners.add(x.ownerId);
    if (x.supportOwnerId) owners.add(x.supportOwnerId);
  }

  const rows = [...owners].map((ownerId) => {
    const ownedOpps = opps.filter((x: any) => x.ownerId === ownerId);
    const supportOpps = opps.filter((x: any) => x.supportOwnerId === ownerId);
    const ownedVars = vars.filter((x: any) => x.ownerId === ownerId && x.status !== "beantwortet");
    const supportVars = vars.filter((x: any) => x.supportOwnerId === ownerId && x.status !== "beantwortet");

    return {
      ownerId,
      ownerName: OWNER_LABELS[ownerId] || ownerId,
      opportunitiesOwned: ownedOpps.length,
      opportunitiesSupport: supportOpps.length,
      missingVariablesOwned: ownedVars.length,
      missingVariablesSupport: supportVars.length,
      totalLoad: ownedOpps.length + supportOpps.length + ownedVars.length + supportVars.length
    };
  }).sort((a, b) => b.totalLoad - a.totalLoad);

  return toPlain(rows);
}
TS

echo "🧠 Operational run orchestrator ..."
cat > lib/operationalHardening.ts <<'TS'
import { listLiveQueryPresets } from "@/lib/liveQueryPresets";
import { getAdapter } from "@/lib/sourceAdapters";
import { appendQueryRun } from "@/lib/queryHistory";
import { probeDeepLinks } from "@/lib/deepLinkProbe";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function runOperationalHardening() {
  const presets = await listLiveQueryPresets();
  const active = presets.filter((x: any) => x.active);

  const queryResults: any[] = [];

  for (const preset of active) {
    const adapter = getAdapter(preset.sourceId);
    if (!adapter || !adapter.canSearch) {
      queryResults.push({
        presetId: preset.id,
        label: preset.label,
        ok: false,
        reason: "Kein suchfähiger Adapter"
      });
      continue;
    }

    const result = await adapter.runQuery(preset.query);
    queryResults.push({
      presetId: preset.id,
      label: preset.label,
      ok: true,
      inserted: result.inserted,
      duplicate: result.duplicate,
      sourceId: result.sourceId,
      query: result.query
    });
  }

  await appendQueryRun({
    mode: "operational_hardening",
    queryCount: active.length,
    inserted: queryResults.filter((x) => x.inserted).length,
    duplicates: queryResults.filter((x) => x.duplicate).length,
    results: queryResults
  });

  const probe = await probeDeepLinks();
  const rebuild = await rebuildOpportunities();

  const db = await readStore();
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const costGaps = Array.isArray(db.costGaps) ? db.costGaps : [];

  return toPlain({
    ok: true,
    presets: active.length,
    queryResults,
    probe,
    rebuild,
    summary: {
      opportunities: opportunities.length,
      missingVariables: costGaps.length
    }
  });
}
TS

echo "🧩 APIs ..."
cat > app/api/ops/run-operational-hardening/route.ts <<'TS'
import { NextResponse } from "next/server";
import { runOperationalHardening } from "@/lib/operationalHardening";

export async function GET() {
  return NextResponse.json(await runOperationalHardening());
}
TS

cat > app/api/missing-variables/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { closeMissingVariableWithParameter, updateMissingVariable } from "@/lib/missingVariablesWorkflow";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateMissingVariable(id, body));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await closeMissingVariableWithParameter(id, body.value, body.status || "defined"));
}
TS

cat > app/api/dashboard/owner-workload/route.ts <<'TS'
import { NextResponse } from "next/server";
import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export async function GET() {
  return NextResponse.json(await buildOwnerWorkload());
}
TS

echo "🧩 Pages ..."
cat > app/owner-workload/page.tsx <<'TSX'
import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export default async function OwnerWorkloadPage() {
  const rows = await buildOwnerWorkload();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Owner Workload</h1>
        <p className="sub">Arbeitsverteilung für 4 Koordinatoren und 2 Assistenzen.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Opportunities</th>
                <th>Support</th>
                <th>Offene Variablen</th>
                <th>Support Variablen</th>
                <th>Gesamtlast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.ownerId}>
                  <td>{x.ownerName}</td>
                  <td>{x.opportunitiesOwned}</td>
                  <td>{x.opportunitiesSupport}</td>
                  <td>{x.missingVariablesOwned}</td>
                  <td>{x.missingVariablesSupport}</td>
                  <td>{x.totalLoad}</td>
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

echo "🧩 Dashboard owner widget ..."
cat > components/dashboard/OwnerWorkloadWidget.tsx <<'TSX'
import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export default async function OwnerWorkloadWidget() {
  const rows = await buildOwnerWorkload();
  const top = rows.slice(0, 6);

  return (
    <div className="card">
      <div className="section-title">Owner-Last</div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Last</th>
            </tr>
          </thead>
          <tbody>
            {top.map((x: any) => (
              <tr key={x.ownerId}>
                <td>{x.ownerName}</td>
                <td>{x.totalLoad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "🧩 Missing variables page enhance ..."
cat > app/missing-variables/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function MissingVariablesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Stunden, Fläche, Frist, Linkvalidität und regionale Standardsätze.</p>
      </div>

      <div className="card">
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
                  <td>{x.question}</td>
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

echo "🧩 Dashboard integrate workload widget ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()

if 'OwnerWorkloadWidget' not in text:
    text = text.replace(
        'import LiveActionBar from "@/components/dashboard/LiveActionBar";',
        'import LiveActionBar from "@/components/dashboard/LiveActionBar";\nimport OwnerWorkloadWidget from "@/components/dashboard/OwnerWorkloadWidget";'
    )
    text = text.replace(
        '<WorkbenchInsights\n          focusHits={data.focusHits}\n          longRuns={data.longRuns}\n          noBidRows={data.noBidRows}\n        />',
        '<WorkbenchInsights\n          focusHits={data.focusHits}\n          longRuns={data.longRuns}\n          noBidRows={data.noBidRows}\n        />\n\n        <OwnerWorkloadWidget />'
    )

p.write_text(text)
print("Dashboard widget integrated")
PY

echo "🧩 Navigation ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

if '"/owner-workload"' not in text:
    text = text.replace(
        '{ href: "/parameter-memory", label: "Parameter" },',
        '{ href: "/parameter-memory", label: "Parameter" },\n  { href: "/owner-workload", label: "Owner-Last" },'
    )
p.write_text(text)
print("Layout navigation updated")
PY

npm run build || true
git add lib/liveQueryPresets.ts lib/missingVariablesWorkflow.ts lib/ownerWorkload.ts lib/operationalHardening.ts app/api/ops/run-operational-hardening/route.ts app/api/missing-variables/[id]/route.ts app/api/dashboard/owner-workload/route.ts app/owner-workload/page.tsx components/dashboard/OwnerWorkloadWidget.tsx app/missing-variables/page.tsx app/page.tsx app/layout.tsx
git commit -m "feat: add operational hardening run, missing variable workflow and owner workload" || true
git push origin main || true

echo "✅ Operational Hardening Slice eingebaut."
