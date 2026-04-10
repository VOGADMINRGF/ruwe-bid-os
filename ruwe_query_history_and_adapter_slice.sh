#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Query History + Adapter Slice"

mkdir -p lib/sourceAdapters
mkdir -p app/api/query-history
mkdir -p app/api/ops/analyze-query-candidates
mkdir -p app/query-history

echo "🧠 Query history logic ..."
cat > lib/queryHistory.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "qrun") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendQueryRun(row: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryHistory) ? db.queryHistory : [];
  const next = [
    {
      id: nextId(),
      createdAt: new Date().toISOString(),
      ...row
    },
    ...rows
  ];
  await replaceCollection("queryHistory" as any, next);
  return next[0];
}

export async function listQueryRuns() {
  const db = await readStore();
  return Array.isArray(db.queryHistory) ? db.queryHistory : [];
}
TS

echo "🧠 Source adapter base ..."
cat > lib/sourceAdapters/base.ts <<'TS'
export type SourceAdapterResult = {
  sourceId: string;
  query: string;
  inserted: boolean;
  duplicate: boolean;
  discoveryMode: "search_query" | "manual_import" | "feed";
  row?: any;
};

export type SourceAdapter = {
  sourceId: string;
  canSearch: boolean;
  runQuery: (query: string) => Promise<SourceAdapterResult>;
};
TS

echo "🧠 Source adapters ..."
cat > lib/sourceAdapters/serviceBund.ts <<'TS'
import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const serviceBundAdapter: SourceAdapter = {
  sourceId: "src_service_bund",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_service_bund",
      query
    });
    return {
      sourceId: "src_service_bund",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
TS

cat > lib/sourceAdapters/ted.ts <<'TS'
import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const tedAdapter: SourceAdapter = {
  sourceId: "src_ted",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_ted",
      query
    });
    return {
      sourceId: "src_ted",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
TS

cat > lib/sourceAdapters/berlin.ts <<'TS'
import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const berlinAdapter: SourceAdapter = {
  sourceId: "src_berlin",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_berlin",
      query
    });
    return {
      sourceId: "src_berlin",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
TS

cat > lib/sourceAdapters/dtvp.ts <<'TS'
import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const dtvpAdapter: SourceAdapter = {
  sourceId: "src_dtvp",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_dtvp",
      query
    });
    return {
      sourceId: "src_dtvp",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
TS

cat > lib/sourceAdapters/index.ts <<'TS'
import { serviceBundAdapter } from "./serviceBund";
import { tedAdapter } from "./ted";
import { berlinAdapter } from "./berlin";
import { dtvpAdapter } from "./dtvp";

export const sourceAdapters = [
  serviceBundAdapter,
  tedAdapter,
  berlinAdapter,
  dtvpAdapter
];

export function getAdapter(sourceId: string) {
  return sourceAdapters.find((x) => x.sourceId === sourceId) || null;
}
TS

echo "🧠 Query ingest with history ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/api/ops/query-ingest/route.ts")
text = p.read_text()

text = '''import { NextResponse } from "next/server";
import { buildQueryMatrix } from "@/lib/queryMatrix";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";
import { appendQueryRun } from "@/lib/queryHistory";
import { getAdapter } from "@/lib/sourceAdapters";

export async function POST() {
  await ensureSourceCapabilities();
  const queries = await buildQueryMatrix();
  const limited = queries.slice(0, 24);

  const results = [];

  for (const q of limited) {
    const adapter = getAdapter(q.sourceId);
    if (!adapter || !adapter.canSearch) {
      results.push({
        sourceId: q.sourceId,
        query: q.query,
        inserted: false,
        duplicate: false,
        skipped: true
      });
      continue;
    }

    const res = await adapter.runQuery(q.query);
    results.push({
      sourceId: q.sourceId,
      query: q.query,
      inserted: res.inserted,
      duplicate: res.duplicate
    });
  }

  const inserted = results.filter((x: any) => x.inserted).length;
  const duplicates = results.filter((x: any) => x.duplicate).length;

  await appendQueryRun({
    mode: "query_ingest",
    queryCount: limited.length,
    inserted,
    duplicates,
    results
  });

  return NextResponse.json({
    ok: true,
    queries: limited.length,
    inserted,
    duplicates,
    results
  });
}
'''
p.write_text(text)
PY

echo "🧠 AI candidate endpoint for query/manual only ..."
cat > app/api/ops/analyze-query-candidates/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";
import { isAiCandidate } from "@/lib/aiGatekeeper";

export async function POST() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];

  const candidates = hits.filter((hit: any) => {
    const discoveryOk = ["search_query", "manual_import"].includes(hit.discoveryMode);
    const gate = isAiCandidate(hit);
    const notDone = !hit.aiAnalyzedAt || hit.aiAnalysisStatus !== "done";
    return discoveryOk && gate.allowed && notDone;
  }).slice(0, 10);

  for (const hit of candidates) {
    const analysis = await orchestrateHitAnalysis(hit);
    const idx = hits.findIndex((x: any) => x.id === hit.id);
    if (idx >= 0) hits[idx] = { ...hits[idx], ...analysis };
  }

  await replaceCollection("sourceHits", hits);

  return NextResponse.json({
    ok: true,
    analyzed: candidates.length
  });
}
TS

echo "🧩 Query history API ..."
cat > app/api/query-history/route.ts <<'TS'
import { NextResponse } from "next/server";
import { listQueryRuns } from "@/lib/queryHistory";

export async function GET() {
  return NextResponse.json(await listQueryRuns());
}
TS

echo "🧩 Query history page ..."
cat > app/query-history/page.tsx <<'TSX'
import { listQueryRuns } from "@/lib/queryHistory";

export default async function QueryHistoryPage() {
  const rows = await listQueryRuns();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Historie</h1>
        <p className="sub">Welche Suchläufe Treffer erzeugt haben und wie hoch die Ausbeute war.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th>Modus</th>
                <th>Queries</th>
                <th>Inserted</th>
                <th>Duplicates</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{row.mode || "-"}</td>
                  <td>{row.queryCount || 0}</td>
                  <td>{row.inserted || 0}</td>
                  <td>{row.duplicates || 0}</td>
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

echo "🧩 Query center erweitern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/query-center/page.tsx")
text = p.read_text()

if '/api/ops/analyze-query-candidates' not in text:
    text = text.replace(
        '<form action="/api/ops/query-ingest" method="POST">\n          <button className="button" type="submit">Query-Ingest starten</button>\n        </form>',
        '<form action="/api/ops/query-ingest" method="POST">\n          <button className="button" type="submit">Query-Ingest starten</button>\n        </form>\n        <form action="/api/ops/analyze-query-candidates" method="POST">\n          <button className="button-secondary" type="submit">Nur Query-/Manual-Kandidaten mit AI prüfen</button>\n        </form>'
    )
    text = text.replace(
        '<div className="card">\n        <div className="section-title">Manuell importierte Treffer</div>',
        '<div className="card">\n        <div className="section-title">Manuell importierte Treffer</div>'
    )
p.write_text(text)
PY

echo "🧩 Layout nav ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

if '"/query-history"' not in text:
    text = text.replace(
        '{ href: "/query-center", label: "Query Center" },',
        '{ href: "/query-center", label: "Query Center" },\n  { href: "/query-history", label: "Query Historie" },'
    )

p.write_text(text)
PY

npm run build || true
git add lib/queryHistory.ts lib/sourceAdapters/base.ts lib/sourceAdapters/serviceBund.ts lib/sourceAdapters/ted.ts lib/sourceAdapters/berlin.ts lib/sourceAdapters/dtvp.ts lib/sourceAdapters/index.ts app/api/ops/query-ingest/route.ts app/api/ops/analyze-query-candidates/route.ts app/api/query-history/route.ts app/query-history/page.tsx app/query-center/page.tsx app/layout.tsx
git commit -m "feat: add query history, source adapter layer and AI analysis for query/manual candidates only" || true
git push origin main || true

echo "✅ Query History + Adapter Slice eingebaut."
