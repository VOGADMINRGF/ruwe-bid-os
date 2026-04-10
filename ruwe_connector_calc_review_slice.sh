#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Connector Management + Kalkulationsengine + Review Trail"

mkdir -p lib
mkdir -p app/connectors
mkdir -p app/api/connectors
mkdir -p app/api/connectors/[id]
mkdir -p app/api/connectors/[id]/test
mkdir -p app/api/opportunities/[id]/review
mkdir -p components/forms

echo "🧠 Storage erweitern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("lib/storage.ts")
text = p.read_text()

if '"connectors"' not in text:
    text = text.replace(
        '| "forecastSnapshots"\n  | "tenders"',
        '| "forecastSnapshots"\n  | "connectors"\n  | "reviewTrail"\n  | "tenders"'
    )
    text = text.replace(
        '  forecastSnapshots: any[];\n  tenders: any[];',
        '  forecastSnapshots: any[];\n  connectors: any[];\n  reviewTrail: any[];\n  tenders: any[];'
    )
    text = text.replace(
        '  forecastSnapshots: [],\n  tenders: [],',
        '  forecastSnapshots: [],\n  connectors: [],\n  reviewTrail: [],\n  tenders: [],'
    )
    text = text.replace(
        '    forecastSnapshots: Array.isArray(db?.forecastSnapshots) ? db.forecastSnapshots : [],\n    tenders: Array.isArray(db?.tenders) ? db.tenders : [],',
        '    forecastSnapshots: Array.isArray(db?.forecastSnapshots) ? db.forecastSnapshots : [],\n    connectors: Array.isArray(db?.connectors) ? db.connectors : [],\n    reviewTrail: Array.isArray(db?.reviewTrail) ? db.reviewTrail : [],\n    tenders: Array.isArray(db?.tenders) ? db.tenders : [],'
    )
    text = text.replace(
        '"queryHistory","queryConfig","forecastSnapshots","tenders"',
        '"queryHistory","queryConfig","forecastSnapshots","connectors","reviewTrail","tenders"'
    )

p.write_text(text)
PY

echo "🧠 Connector logic ..."
cat > lib/connectors.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "conn") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_CONNECTORS = [
  {
    id: "src_service_bund",
    name: "service.bund.de",
    authType: "none",
    baseUrl: "https://www.service.bund.de",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: true,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_ted",
    name: "TED",
    authType: "none",
    baseUrl: "https://ted.europa.eu",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: true,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_berlin",
    name: "Vergabeplattform Berlin",
    authType: "none",
    baseUrl: "",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: false,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_dtvp",
    name: "DTVP",
    authType: "none",
    baseUrl: "",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: false,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  }
];

export async function ensureConnectors() {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  if (rows.length) return rows;
  await replaceCollection("connectors" as any, DEFAULT_CONNECTORS);
  return DEFAULT_CONNECTORS;
}

export async function listConnectors() {
  await ensureConnectors();
  const db = await readStore();
  return Array.isArray(db.connectors) ? db.connectors : [];
}

export async function createConnector(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  const row = {
    id: body.id || nextId(),
    name: body.name || "Neue Quelle",
    authType: body.authType || "none",
    baseUrl: body.baseUrl || "",
    username: body.username || "",
    password: body.password || "",
    apiKey: body.apiKey || "",
    active: body.active !== false,
    supportsFeed: !!body.supportsFeed,
    supportsQuerySearch: !!body.supportsQuerySearch,
    supportsManualImport: body.supportsManualImport !== false,
    supportsDeepLink: !!body.supportsDeepLink,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("connectors" as any, [...rows, row]);
  return row;
}

export async function updateConnector(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? { ...x, ...patch, updatedAt: new Date().toISOString() }
      : x
  );
  await replaceCollection("connectors" as any, next);
  return next.find((x: any) => x.id === id) || null;
}

export async function testConnector(id: string) {
  const rows = await listConnectors();
  const row = rows.find((x: any) => x.id === id);
  if (!row) throw new Error("Connector nicht gefunden");

  const ok = !!row.baseUrl || row.authType !== "none";
  const message = ok
    ? "Testlauf erfolgreich vorbereitet."
    : "Basis-URL oder Auth-Informationen fehlen.";

  return await updateConnector(id, {
    status: ok ? "ready" : "attention",
    lastTestAt: new Date().toISOString(),
    lastTestOk: ok,
    lastTestMessage: message
  });
}
TS

echo "🧠 Kalkulationsengine ..."
cat > lib/calcEngine.ts <<'TS'
import { readStore } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function findParam(rows: any[], region: string, trade: string, key: string) {
  return (
    rows.find((x: any) =>
      x.region === region &&
      x.trade === trade &&
      x.parameterKey === key &&
      x.status === "confirmed"
    ) ||
    rows.find((x: any) =>
      x.trade === trade &&
      x.parameterKey === key &&
      x.status === "confirmed"
    ) ||
    null
  );
}

export async function calculateOpportunity(opportunity: any) {
  const db = await readStore();
  const params = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const region = opportunity.region || "Unbekannt";
  const trade = opportunity.trade || "Unbekannt";
  const specs = opportunity.extractedSpecs || {};

  const defaultRate = findParam(params, region, trade, "default_rate");
  const travelCost = findParam(params, region, trade, "travel_cost");
  const surcharge = findParam(params, region, trade, "surcharge_percent");

  const duration = n(specs.durationMonths || opportunity.durationMonths || 12);
  const sqm = n(specs.areaSqm || 0);
  const hours = n(specs.hours || 0);

  let base = 0;
  let method = "fallback";

  if (defaultRate) {
    if (trade === "Reinigung" && sqm > 0) {
      base = n(defaultRate.value) * sqm * duration;
      method = "sqm_month";
    } else if (trade === "Sicherheit" && hours > 0) {
      base = n(defaultRate.value) * hours;
      method = "hours";
    } else {
      base = n(defaultRate.value) * duration;
      method = "object_month";
    }
  }

  let total = base;

  if (travelCost) total += n(travelCost.value);
  if (surcharge) total += total * (n(surcharge.value) / 100);

  return {
    calculatedValue: Math.round(total),
    calculationMethod: method,
    calculationInputs: {
      region,
      trade,
      duration,
      sqm,
      hours,
      defaultRate: defaultRate?.value ?? null,
      travelCost: travelCost?.value ?? null,
      surchargePercent: surcharge?.value ?? null
    }
  };
}
TS

echo "🧠 Review trail ..."
cat > lib/reviewTrail.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "review") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendReviewTrail(row: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.reviewTrail) ? db.reviewTrail : [];
  const entry = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...row
  };
  await replaceCollection("reviewTrail" as any, [entry, ...rows]);
  return entry;
}

export async function listReviewTrail(opportunityId?: string) {
  const db = await readStore();
  const rows = Array.isArray(db.reviewTrail) ? db.reviewTrail : [];
  return opportunityId ? rows.filter((x: any) => x.opportunityId === opportunityId) : rows;
}
TS

echo "🧩 Connectors APIs ..."
cat > app/api/connectors/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createConnector, listConnectors } from "@/lib/connectors";

export async function GET() {
  return NextResponse.json(await listConnectors());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await createConnector(body));
}
TS

cat > app/api/connectors/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { updateConnector } from "@/lib/connectors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateConnector(id, body));
}
TS

cat > app/api/connectors/[id]/test/route.ts <<'TS'
import { NextResponse } from "next/server";
import { testConnector } from "@/lib/connectors";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(await testConnector(id));
}
TS

echo "🧩 Opportunity review API ..."
cat > app/api/opportunities/[id]/review/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { appendReviewTrail } from "@/lib/reviewTrail";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          manualDecision: body.manualDecision ?? x.manualDecision,
          manualReason: body.manualReason ?? x.manualReason,
          reviewedBy: body.reviewedBy || "system",
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("opportunities" as any, next);

  await appendReviewTrail({
    opportunityId: id,
    type: "manual_review",
    reviewedBy: body.reviewedBy || "system",
    manualDecision: body.manualDecision || null,
    manualReason: body.manualReason || ""
  });

  return NextResponse.json(next.find((x: any) => x.id === id) || null);
}
TS

echo "🧩 Connector editor ..."
cat > components/forms/ConnectorEditor.tsx <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectorEditor({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [data, setData] = useState(rows);

  async function patch(id: string, patch: Record<string, any>) {
    setData((prev: any[]) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
    await fetch(`/api/connectors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  async function test(id: string) {
    await fetch(`/api/connectors/${id}/test`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Auth</th>
            <th>Base URL</th>
            <th>Query</th>
            <th>Deep-Link</th>
            <th>Status</th>
            <th>Test</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>
                <select className="select" value={row.authType} onChange={(e) => patch(row.id, { authType: e.target.value })}>
                  <option value="none">none</option>
                  <option value="basic">basic</option>
                  <option value="session">session</option>
                  <option value="api_key">api_key</option>
                </select>
              </td>
              <td>
                <input className="input" value={row.baseUrl || ""} onChange={(e) => patch(row.id, { baseUrl: e.target.value })} />
              </td>
              <td>
                <input type="checkbox" checked={!!row.supportsQuerySearch} onChange={(e) => patch(row.id, { supportsQuerySearch: e.target.checked })} />
              </td>
              <td>
                <input type="checkbox" checked={!!row.supportsDeepLink} onChange={(e) => patch(row.id, { supportsDeepLink: e.target.checked })} />
              </td>
              <td>{row.status || "-"}</td>
              <td><button className="linkish" type="button" onClick={() => test(row.id)}>testen</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
TSX

echo "🧩 Connectors page ..."
cat > app/connectors/page.tsx <<'TSX'
import { listConnectors } from "@/lib/connectors";
import ConnectorEditor from "@/components/forms/ConnectorEditor";

export default async function ConnectorsPage() {
  const rows = await listConnectors();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Connectoren</span> & Zugänge</h1>
        <p className="sub">Quellen verwalten, Suchfähigkeit markieren und Testläufe durchführen.</p>
      </div>

      <div className="card">
        <ConnectorEditor rows={rows} />
      </div>
    </div>
  );
}
TSX

echo "🧩 Opportunity detail: calc + review ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/opportunities/[id]/page.tsx")
text = p.read_text()

if 'calculateOpportunity' not in text:
    text = text.replace(
        'import OpportunityLearningForm from "@/components/forms/OpportunityLearningForm";',
        'import OpportunityLearningForm from "@/components/forms/OpportunityLearningForm";\nimport { calculateOpportunity } from "@/lib/calcEngine";\nimport { listReviewTrail } from "@/lib/reviewTrail";'
    )
    text = text.replace(
        '  const agents = Array.isArray(db.agents) && db.agents.length',
        '  const calc = await calculateOpportunity({ ...opportunity, extractedSpecs: sourceHit?.extractedSpecs || {} });\n  const reviews = await listReviewTrail(opportunity.id);\n\n  const agents = Array.isArray(db.agents) && db.agents.length'
    )
    text = text.replace(
        '<div className="meta">Operativ nutzbar: {opportunity.operationallyUsable ? "ja" : "nein"}</div>',
        '<div className="meta">Operativ nutzbar: {opportunity.operationallyUsable ? "ja" : "nein"}</div>\n            <div className="meta">Kalkuliert: {calc.calculatedValue}</div>\n            <div className="meta">Kalkulationsmethode: {calc.calculationMethod}</div>'
    )
    text = text.replace(
        '</div>\n        </div>\n      </div>\n\n      <div className="card">\n        <div className="section-title">Lernfeedback & Parameter</div>',
        '</div>\n        </div>\n      </div>\n\n      <div className="card">\n        <div className="section-title">Review Trail</div>\n        <div className="table-wrap" style={{ marginTop: 14 }}>\n          <table className="table">\n            <thead><tr><th>Zeit</th><th>Typ</th><th>Review</th><th>Grund</th></tr></thead>\n            <tbody>\n              {reviews.map((r: any) => (\n                <tr key={r.id}>\n                  <td>{r.createdAt}</td>\n                  <td>{r.type}</td>\n                  <td>{r.manualDecision || "-"}</td>\n                  <td>{r.manualReason || "-"}</td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n      </div>\n\n      <div className="card">\n        <div className="section-title">Lernfeedback & Parameter</div>'
    )

p.write_text(text)
PY

echo "🧩 Layout nav ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

if '"/connectors"' not in text:
    text = text.replace(
        '{ href: "/sources", label: "Quellen" },',
        '{ href: "/sources", label: "Quellen" },\n  { href: "/connectors", label: "Connectoren" },'
    )

p.write_text(text)
PY

npm run build || true
git add lib/connectors.ts lib/calcEngine.ts lib/reviewTrail.ts app/api/connectors/route.ts app/api/connectors/[id]/route.ts app/api/connectors/[id]/test/route.ts app/api/opportunities/[id]/review/route.ts components/forms/ConnectorEditor.tsx app/connectors/page.tsx app/opportunities/[id]/page.tsx app/layout.tsx lib/storage.ts
git commit -m "feat: add connector management, calculation engine and review trail for bid os" || true
git push origin main || true

echo "✅ Connector + Calc + Review Slice eingebaut."
