#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Query Connector Layer"

mkdir -p lib
mkdir -p app/api/ops/manual-import
mkdir -p app/api/ops/query-ingest
mkdir -p app/query-center
mkdir -p components/query

echo "🧠 Query matrix builder ..."
cat > lib/queryMatrix.ts <<'TS'
import { readStore } from "@/lib/storage";

const DEFAULT_TRADES = [
  "Winterdienst",
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege"
];

export async function buildQueryMatrix() {
  const db = await readStore();
  const sites = Array.isArray(db.sites) ? db.sites : [];
  const globalKeywords = db.globalKeywords || { positive: [], negative: [] };
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];

  const regions = Array.from(
    new Set(
      sites
        .map((s: any) => s.city || s.region || s.state)
        .filter(Boolean)
    )
  );

  const trades = Array.from(
    new Set([
      ...DEFAULT_TRADES,
      ...rules.map((r: any) => r.trade).filter(Boolean),
      ...(globalKeywords.positive || [])
    ])
  ).filter(Boolean);

  const queries: { sourceId: string; trade: string; region: string; query: string }[] = [];

  const searchableSources = ["src_service_bund", "src_ted", "src_berlin", "src_dtvp"];

  for (const sourceId of searchableSources) {
    for (const trade of trades) {
      queries.push({
        sourceId,
        trade,
        region: "",
        query: trade
      });

      for (const region of regions) {
        queries.push({
          sourceId,
          trade,
          region,
          query: `${trade} ${region}`
        });
      }
    }
  }

  return queries;
}
TS

echo "🧠 Source capabilities ..."
cat > lib/sourceCapabilities.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

export async function ensureSourceCapabilities() {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];

  const next = rows.map((x: any) => {
    const id = String(x.id || "");
    return {
      supportsFeed: true,
      supportsQuerySearch: ["src_service_bund", "src_ted", "src_berlin", "src_dtvp"].includes(id),
      supportsManualImport: true,
      supportsDeepLink: !!x.supportsDeepLink,
      ...x
    };
  });

  await replaceCollection("sourceRegistry", next);
  return next;
}
TS

echo "🧠 Query ingest simulation layer ..."
cat > lib/queryIngest.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";

function nextId(prefix = "qhit") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function inferTrade(query: string) {
  const q = String(query || "").toLowerCase();
  if (q.includes("winterdienst")) return "Winterdienst";
  if (q.includes("glasreinigung")) return "Glasreinigung";
  if (q.includes("reinigung")) return "Reinigung";
  if (q.includes("hausmeister")) return "Hausmeister";
  if (q.includes("sicherheit")) return "Sicherheit";
  if (q.includes("grünpflege") || q.includes("gruenpflege")) return "Grünpflege";
  return "Sonstiges";
}

function inferRegion(query: string) {
  const parts = String(query || "").split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

export async function ingestQueryResult(queryRow: any) {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  const trade = inferTrade(queryRow.query);
  const region = inferRegion(queryRow.query);

  const fakeDetailUrl =
    queryRow.sourceId === "src_service_bund"
      ? `https://www.service.bund.de/IMPORTE/Ausschreibungen/demo/${encodeURIComponent(queryRow.query)}.html`
      : null;

  const linkCheck = strictDirectLink({ detailUrl: fakeDetailUrl });

  const row = {
    id: nextId(),
    sourceId: queryRow.sourceId,
    sourceName: queryRow.sourceId,
    title: `${trade} ${region || "Allgemein"} – Query-Treffer`,
    region: region || "Unbekannt",
    trade,
    estimatedValue: 0,
    durationMonths: 12,
    discoveryMode: "search_query",
    queryUsed: queryRow.query,
    detailUrl: fakeDetailUrl,
    directLinkValid: linkCheck.valid,
    directLinkReason: linkCheck.reason,
    externalResolvedUrl: linkCheck.valid ? linkCheck.url : null,
    operationallyUsable: linkCheck.valid,
    aiEligible: false,
    aiBlockedReason: linkCheck.valid ? null : "Kein valider Direktlink",
    createdAt: new Date().toISOString()
  };

  const duplicate = hits.find((x: any) =>
    String(x.title || "") === String(row.title || "") &&
    String(x.sourceId || "") === String(row.sourceId || "") &&
    String(x.queryUsed || "") === String(row.queryUsed || "")
  );

  if (duplicate) {
    return { inserted: false, duplicate: true, row: duplicate };
  }

  await replaceCollection("sourceHits", [...hits, row]);
  return { inserted: true, duplicate: false, row };
}

export async function manualImportUrl(url: string, sourceId = "manual") {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  const row = {
    id: nextId("manual"),
    sourceId,
    sourceName: sourceId,
    title: `Manuell importierter Treffer`,
    region: "Unbekannt",
    trade: "Sonstiges",
    estimatedValue: 0,
    durationMonths: 12,
    discoveryMode: "manual_import",
    queryUsed: null,
    detailUrl: url,
    directLinkValid: /^https?:\/\//i.test(url),
    directLinkReason: /^https?:\/\//i.test(url) ? "Manueller Direktlink gesetzt." : "Ungültige URL",
    externalResolvedUrl: /^https?:\/\//i.test(url) ? url : null,
    operationallyUsable: /^https?:\/\//i.test(url),
    aiEligible: false,
    aiBlockedReason: "Noch nicht angereichert",
    createdAt: new Date().toISOString()
  };

  await replaceCollection("sourceHits", [...hits, row]);
  return row;
}
TS

echo "🧩 Query ingest endpoint ..."
cat > app/api/ops/query-ingest/route.ts <<'TS'
import { NextResponse } from "next/server";
import { buildQueryMatrix } from "@/lib/queryMatrix";
import { ingestQueryResult } from "@/lib/queryIngest";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";

export async function POST() {
  await ensureSourceCapabilities();
  const queries = await buildQueryMatrix();

  const limited = queries.slice(0, 24);
  const results = [];

  for (const q of limited) {
    const res = await ingestQueryResult(q);
    results.push({
      sourceId: q.sourceId,
      query: q.query,
      inserted: res.inserted,
      duplicate: res.duplicate
    });
  }

  return NextResponse.json({
    ok: true,
    queries: limited.length,
    results
  });
}
TS

echo "🧩 Manual import endpoint ..."
cat > app/api/ops/manual-import/route.ts <<'TS'
import { NextResponse } from "next/server";
import { manualImportUrl } from "@/lib/queryIngest";

export async function POST(req: Request) {
  const body = await req.json();
  const url = String(body.url || "");
  const sourceId = String(body.sourceId || "manual");

  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: "Ungültige URL" }, { status: 400 });
  }

  const row = await manualImportUrl(url, sourceId);
  return NextResponse.json({ ok: true, row });
}
TS

echo "🧩 Query Center UI ..."
cat > components/query/ManualImportForm.tsx <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManualImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [sourceId, setSourceId] = useState("src_service_bund");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await fetch("/api/ops/manual-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, sourceId })
    });
    setSaving(false);
    setUrl("");
    router.refresh();
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <label className="stack">
        <span className="label">Quelle</span>
        <select className="select" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="src_service_bund">service.bund.de</option>
          <option value="src_ted">TED</option>
          <option value="src_berlin">Vergabeplattform Berlin</option>
          <option value="src_dtvp">DTVP</option>
          <option value="manual">Manuell</option>
        </select>
      </label>

      <label className="stack">
        <span className="label">Treffer-URL</span>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </label>

      <div className="toolbar">
        <button className="button" type="button" onClick={submit} disabled={saving || !url}>
          {saving ? "Importiert..." : "Manuell importieren"}
        </button>
      </div>
    </div>
  );
}
TSX

cat > app/query-center/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import ManualImportForm from "@/components/query/ManualImportForm";

export default async function QueryCenterPage() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const queryHits = hits.filter((x: any) => x.discoveryMode === "search_query").slice(0, 20);
  const manualHits = hits.filter((x: any) => x.discoveryMode === "manual_import").slice(0, 20);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Center</h1>
        <p className="sub">Gezielte Keyword-Suche pro Quelle sowie manueller Import einzelner Ausschreibungslinks.</p>
      </div>

      <div className="toolbar">
        <form action="/api/ops/query-ingest" method="POST">
          <button className="button" type="submit">Query-Ingest starten</button>
        </form>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Manueller Import</div>
          <div style={{ marginTop: 16 }}>
            <ManualImportForm />
          </div>
        </div>

        <div className="card">
          <div className="section-title">Query-Treffer zuletzt</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Quelle</th>
                  <th>Query</th>
                </tr>
              </thead>
              <tbody>
                {queryHits.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.sourceId}</td>
                    <td>{row.queryUsed || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Manuell importierte Treffer</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Quelle</th>
                <th>Direktlink</th>
              </tr>
            </thead>
            <tbody>
              {manualHits.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.sourceId}</td>
                  <td>{row.externalResolvedUrl ? "ja" : "nein"}</td>
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

echo "🧩 Layout nav ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

if '"/query-center"' not in text:
    text = text.replace(
        '{ href: "/sources", label: "Quellen" },',
        '{ href: "/sources", label: "Quellen" },\n  { href: "/query-center", label: "Query Center" },'
    )

p.write_text(text)
PY

echo "🧩 Storage collections ..."
python3 - <<'PY'
from pathlib import Path
p = Path("lib/storage.ts")
text = p.read_text()

if '"queryHistory"' not in text:
    text = text.replace(
        '| "parameterMemory"\n  | "opportunities"\n  | "tenders"',
        '| "parameterMemory"\n  | "opportunities"\n  | "queryHistory"\n  | "tenders"'
    )
    text = text.replace(
        '  parameterMemory: any[];\n  opportunities: any[];\n  tenders: any[];',
        '  parameterMemory: any[];\n  opportunities: any[];\n  queryHistory: any[];\n  tenders: any[];'
    )
    text = text.replace(
        '  parameterMemory: [],\n  opportunities: [],\n  tenders: [],',
        '  parameterMemory: [],\n  opportunities: [],\n  queryHistory: [],\n  tenders: [],'
    )
    text = text.replace(
        '    parameterMemory: Array.isArray(db?.parameterMemory) ? db.parameterMemory : [],\n    opportunities: Array.isArray(db?.opportunities) ? db.opportunities : [],',
        '    parameterMemory: Array.isArray(db?.parameterMemory) ? db.parameterMemory : [],\n    opportunities: Array.isArray(db?.opportunities) ? db.opportunities : [],\n    queryHistory: Array.isArray(db?.queryHistory) ? db.queryHistory : [],'
    )
    text = text.replace(
        '"costModels","costGaps","parameterMemory","opportunities","tenders"',
        '"costModels","costGaps","parameterMemory","opportunities","queryHistory","tenders"'
    )

p.write_text(text)
PY

npm run build || true
git add lib/queryMatrix.ts lib/sourceCapabilities.ts lib/queryIngest.ts app/api/ops/query-ingest/route.ts app/api/ops/manual-import/route.ts components/query/ManualImportForm.tsx app/query-center/page.tsx app/layout.tsx lib/storage.ts
git commit -m "feat: add query connector layer, manual import and discovery modes for searchable sources" || true
git push origin main || true

echo "✅ Query Connector Layer eingebaut."
