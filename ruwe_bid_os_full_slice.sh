#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Full Slice"

mkdir -p lib
mkdir -p app/api/agents/workload
mkdir -p app/api/query-config
mkdir -p app/api/query-config/[id]
mkdir -p app/api/forecast/summary
mkdir -p app/forecast
mkdir -p app/agents/workload
mkdir -p app/query-config
mkdir -p components/forms

echo "🧠 Storage erweitern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("lib/storage.ts")
text = p.read_text()

if '"queryConfig"' not in text:
    text = text.replace(
        '| "queryHistory"\n  | "tenders"',
        '| "queryHistory"\n  | "queryConfig"\n  | "forecastSnapshots"\n  | "tenders"'
    )
    text = text.replace(
        '  queryHistory: any[];\n  tenders: any[];',
        '  queryHistory: any[];\n  queryConfig: any[];\n  forecastSnapshots: any[];\n  tenders: any[];'
    )
    text = text.replace(
        '  queryHistory: [],\n  tenders: [],',
        '  queryHistory: [],\n  queryConfig: [],\n  forecastSnapshots: [],\n  tenders: [],'
    )
    text = text.replace(
        '    queryHistory: Array.isArray(db?.queryHistory) ? db.queryHistory : [],\n    tenders: Array.isArray(db?.tenders) ? db.tenders : [],',
        '    queryHistory: Array.isArray(db?.queryHistory) ? db.queryHistory : [],\n    queryConfig: Array.isArray(db?.queryConfig) ? db.queryConfig : [],\n    forecastSnapshots: Array.isArray(db?.forecastSnapshots) ? db.forecastSnapshots : [],\n    tenders: Array.isArray(db?.tenders) ? db.tenders : [],'
    )
    text = text.replace(
        '"parameterMemory","opportunities","queryHistory","tenders"',
        '"parameterMemory","opportunities","queryHistory","queryConfig","forecastSnapshots","tenders"'
    )

p.write_text(text)
PY

echo "🧠 Query config logic ..."
cat > lib/queryConfig.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "qcfg") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ROWS = [
  { sourceId: "src_service_bund", trade: "Winterdienst", region: "Berlin", query: "Winterdienst Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Reinigung", region: "Berlin", query: "Reinigung Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Glasreinigung", region: "Berlin", query: "Glasreinigung Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Hausmeister", region: "Magdeburg", query: "Hausmeister Magdeburg", active: true, priority: "B" },
  { sourceId: "src_service_bund", trade: "Sicherheit", region: "Magdeburg", query: "Sicherheit Magdeburg", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Grünpflege", region: "Potsdam", query: "Grünpflege Potsdam", active: true, priority: "B" },
  { sourceId: "src_ted", trade: "Reinigung", region: "Berlin", query: "Reinigung Berlin", active: true, priority: "B" },
  { sourceId: "src_dtvp", trade: "Winterdienst", region: "Leipzig", query: "Winterdienst Leipzig", active: true, priority: "B" }
];

export async function ensureQueryConfig() {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  if (rows.length) return rows;

  const next = DEFAULT_ROWS.map((x) => ({
    id: nextId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...x
  }));

  await replaceCollection("queryConfig" as any, next);
  return next;
}

export async function listQueryConfig() {
  await ensureQueryConfig();
  const db = await readStore();
  return Array.isArray(db.queryConfig) ? db.queryConfig : [];
}

export async function createQueryConfig(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  const row = {
    id: nextId(),
    sourceId: body.sourceId || "src_service_bund",
    trade: body.trade || "Unbekannt",
    region: body.region || "",
    query: body.query || "",
    active: body.active !== false,
    priority: body.priority || "B",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("queryConfig" as any, [...rows, row]);
  return row;
}

export async function updateQueryConfig(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  const next = rows.map((x: any) =>
    x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
  );
  await replaceCollection("queryConfig" as any, next);
  return next.find((x: any) => x.id === id) || null;
}
TS

echo "🧠 Agents / workload logic ..."
cat > lib/agentWorkload.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

const DEFAULT_AGENTS = [
  { id: "coord_berlin", name: "Koordinator Berlin", role: "koordinator", regionFocus: "Berlin", active: true },
  { id: "coord_ost", name: "Koordinator Ost", role: "koordinator", regionFocus: "Brandenburg", active: true },
  { id: "coord_sachsen", name: "Koordinator Sachsen", role: "koordinator", regionFocus: "Sachsen", active: true },
  { id: "coord_security", name: "Koordinator Sicherheit", role: "koordinator", regionFocus: "Magdeburg", active: true },
  { id: "assist_a", name: "Assistenz A", role: "assistenz", regionFocus: "Berlin", active: true },
  { id: "assist_b", name: "Assistenz B", role: "assistenz", regionFocus: "Leipzig", active: true }
];

export async function ensureAgents() {
  const db = await readStore();
  const rows = Array.isArray(db.agents) ? db.agents : [];
  if (rows.length) return rows;
  await replaceCollection("agents", DEFAULT_AGENTS as any);
  return DEFAULT_AGENTS;
}

export async function computeAgentWorkload() {
  await ensureAgents();
  const db = await readStore();
  const agents = Array.isArray(db.agents) ? db.agents : [];
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];

  return agents.map((agent: any) => {
    const rows = opportunities.filter((x: any) => x.ownerId === agent.id);
    const open = rows.filter((x: any) => ["open", "active"].includes(x.status));
    const overdue = rows.filter((x: any) => {
      if (!x.dueDate) return false;
      return new Date(x.dueDate).getTime() < Date.now();
    });
    const highPriority = rows.filter((x: any) => x.priority === "A");
    return {
      ...agent,
      assigned: rows.length,
      open: open.length,
      overdue: overdue.length,
      highPriority: highPriority.length
    };
  });
}
TS

echo "🧠 Forecast logic ..."
cat > lib/forecastSummary.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export async function buildForecastSummary() {
  const db = await readStore();
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const usableHits = (db.sourceHits || []).filter((x: any) => x.operationallyUsable);

  const byRegionTrade = new Map<string, any>();

  for (const hit of usableHits) {
    const key = `${hit.region || "Unbekannt"}__${hit.trade || "Unbekannt"}`;
    const prev = byRegionTrade.get(key) || {
      region: hit.region || "Unbekannt",
      trade: hit.trade || "Unbekannt",
      hitCount: 0,
      value: 0,
      bidCount: 0,
      reviewCount: 0
    };

    prev.hitCount += 1;
    prev.value += n(hit.estimatedValue);
    if (hit.aiRecommendation === "Bid") prev.bidCount += 1;
    if (hit.aiRecommendation === "Prüfen") prev.reviewCount += 1;

    byRegionTrade.set(key, prev);
  }

  const hotspots = [...byRegionTrade.values()]
    .sort((a: any, b: any) => b.value - a.value || b.hitCount - a.hitCount)
    .slice(0, 12);

  const summary = {
    createdAt: new Date().toISOString(),
    hotspots,
    totalOpportunityValue: opps.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
    totalOpportunities: opps.length
  };

  const dbPrev = await readStore();
  const snaps = Array.isArray(dbPrev.forecastSnapshots) ? dbPrev.forecastSnapshots : [];
  await replaceCollection("forecastSnapshots" as any, [summary, ...snaps].slice(0, 20));

  return summary;
}
TS

echo "🧩 Query config APIs ..."
cat > app/api/query-config/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createQueryConfig, listQueryConfig } from "@/lib/queryConfig";

export async function GET() {
  return NextResponse.json(await listQueryConfig());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await createQueryConfig(body));
}
TS

cat > app/api/query-config/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { updateQueryConfig } from "@/lib/queryConfig";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateQueryConfig(id, body));
}
TS

echo "🧩 Agent workload API ..."
cat > app/api/agents/workload/route.ts <<'TS'
import { NextResponse } from "next/server";
import { computeAgentWorkload } from "@/lib/agentWorkload";

export async function GET() {
  return NextResponse.json(await computeAgentWorkload());
}
TS

echo "🧩 Forecast API ..."
cat > app/api/forecast/summary/route.ts <<'TS'
import { NextResponse } from "next/server";
import { buildForecastSummary } from "@/lib/forecastSummary";

export async function GET() {
  return NextResponse.json(await buildForecastSummary());
}
TS

echo "🧩 Query config editor ..."
cat > components/forms/QueryConfigEditor.tsx <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QueryConfigEditor({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [data, setData] = useState(rows);

  async function updateRow(id: string, patch: Record<string, any>) {
    setData((prev: any[]) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    await fetch(`/api/query-config/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Quelle</th>
            <th>Gewerk</th>
            <th>Region</th>
            <th>Query</th>
            <th>Priorität</th>
            <th>Aktiv</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.sourceId}</td>
              <td>{row.trade}</td>
              <td>{row.region}</td>
              <td>
                <input
                  className="input"
                  value={row.query}
                  onChange={(e) => updateRow(row.id, { query: e.target.value })}
                />
              </td>
              <td>
                <select
                  className="select"
                  value={row.priority}
                  onChange={(e) => updateRow(row.id, { priority: e.target.value })}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!row.active}
                  onChange={(e) => updateRow(row.id, { active: e.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
TSX

echo "🧩 Query config page ..."
cat > app/query-config/page.tsx <<'TSX'
import { listQueryConfig } from "@/lib/queryConfig";
import QueryConfigEditor from "@/components/forms/QueryConfigEditor";

export default async function QueryConfigPage() {
  const rows = await listQueryConfig();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Konfiguration</h1>
        <p className="sub">Quelle, Gewerk, Region und Suchbegriff als operative Suchmatrix pflegen.</p>
      </div>

      <div className="card">
        <QueryConfigEditor rows={rows} />
      </div>
    </div>
  );
}
TSX

echo "🧩 Forecast page ..."
cat > app/forecast/page.tsx <<'TSX'
import { buildForecastSummary } from "@/lib/forecastSummary";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function ForecastPage() {
  const summary = await buildForecastSummary();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Forecast</span> & Fokusfelder</h1>
        <p className="sub">Wo sich künftige Vertriebs- und Ausschreibungsbearbeitung am stärksten lohnt.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Opportunity-Volumen</div>
          <div className="kpi-compact">{formatCurrencyCompact(summary.totalOpportunityValue)}</div>
          <div className="metric-sub">{summary.totalOpportunities} Opportunities</div>
        </div>

        <div className="card">
          <div className="label">Aktualisiert</div>
          <div className="kpi-compact">{summary.createdAt.slice(0, 10)}</div>
          <div className="metric-sub">Forecast-Snapshot</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Region × Gewerk Hotspots</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Treffer</th>
                <th>Volumen</th>
                <th>Bid</th>
                <th>Prüfen</th>
              </tr>
            </thead>
            <tbody>
              {summary.hotspots.map((row: any) => (
                <tr key={`${row.region}_${row.trade}`}>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.hitCount}</td>
                  <td>{formatCurrencyCompact(row.value)}</td>
                  <td>{row.bidCount}</td>
                  <td>{row.reviewCount}</td>
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

echo "🧩 Agent workload page ..."
cat > app/agents/workload/page.tsx <<'TSX'
import { computeAgentWorkload } from "@/lib/agentWorkload";

export default async function AgentWorkloadPage() {
  const rows = await computeAgentWorkload();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Agenten</span> & Auslastung</h1>
        <p className="sub">Koordinatoren und Assistenzen mit offenen Vorgängen, Priorität und Überfälligkeiten.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rolle</th>
                <th>Fokus</th>
                <th>Zugewiesen</th>
                <th>Offen</th>
                <th>Überfällig</th>
                <th>Priorität A</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>{row.regionFocus}</td>
                  <td>{row.assigned}</td>
                  <td>{row.open}</td>
                  <td>{row.overdue}</td>
                  <td>{row.highPriority}</td>
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

echo "🧩 Opportunity detail with missing parameter hints ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/opportunities/[id]/page.tsx")
text = p.read_text()

if "Fehlende Parameter" not in text:
    text = text.replace(
        '<div className="meta">Operativ nutzbar: {opportunity.operationallyUsable ? "ja" : "nein"}</div>',
        '<div className="meta">Operativ nutzbar: {opportunity.operationallyUsable ? "ja" : "nein"}</div>\n            <div className="meta">Fehlende Parameter: {(!opportunity.estimatedValue || opportunity.estimatedValue <= 0) ? "Volumen-/Kostenlogik prüfen" : "-"}</div>'
    )

p.write_text(text)
PY

echo "🧩 Layout navigation ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

if '"/query-config"' not in text:
    text = text.replace(
        '{ href: "/query-history", label: "Query Historie" },',
        '{ href: "/query-history", label: "Query Historie" },\n  { href: "/query-config", label: "Query Konfig" },'
    )

if '"/forecast"' not in text:
    text = text.replace(
        '{ href: "/opportunities", label: "Opportunities" },',
        '{ href: "/opportunities", label: "Opportunities" },\n  { href: "/forecast", label: "Forecast" },'
    )

if '"/agents/workload"' not in text:
    text = text.replace(
        '{ href: "/agents", label: "Agenten" },',
        '{ href: "/agents", label: "Agenten" },\n  { href: "/agents/workload", label: "Auslastung" },'
    )

p.write_text(text)
PY

npm run build || true
git add lib/queryConfig.ts lib/agentWorkload.ts lib/forecastSummary.ts app/api/query-config/route.ts app/api/query-config/[id]/route.ts app/api/agents/workload/route.ts app/api/forecast/summary/route.ts components/forms/QueryConfigEditor.tsx app/query-config/page.tsx app/forecast/page.tsx app/agents/workload/page.tsx app/opportunities/[id]/page.tsx app/layout.tsx lib/storage.ts
git commit -m "feat: expand into bid os with query config, agent workload and forecast focus surfaces" || true
git push origin main || true

echo "✅ Full Bid OS Slice eingebaut."
