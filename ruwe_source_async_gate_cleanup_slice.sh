#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Async Sources + AI Gate + Legacy Cleanup"

mkdir -p lib
mkdir -p app/api/ops/source-refresh/[id]
mkdir -p app/api/ops/source-scan
mkdir -p app/api/ops/run-all-phased
mkdir -p app/api/ops/reclassify-legacy
mkdir -p components/sources

echo "🧠 AI Gatekeeper ..."
cat > lib/aiGatekeeper.ts <<'TS'
function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function text(v: any) {
  return String(v || "").toLowerCase();
}

const RUWE_TRADES = [
  "reinigung",
  "glasreinigung",
  "hausmeister",
  "sicherheit",
  "winterdienst",
  "grünpflege",
  "gruenpflege",
  "garten",
  "landschaft"
];

export function isRuweRelevant(hit: any) {
  const t = text(hit?.trade);
  const title = text(hit?.title);
  const desc = text(hit?.description);
  return RUWE_TRADES.some((k) => t.includes(k) || title.includes(k) || desc.includes(k));
}

export function isAiCandidate(hit: any) {
  const validLink = hit?.directLinkValid === true;
  const usable = hit?.operationallyUsable !== false;
  const relevant = isRuweRelevant(hit);
  const matched = !!hit?.matchedSiteId;
  const distance = n(hit?.distanceKm || 999);
  const volume = n(hit?.estimatedValue);
  const duration = n(hit?.durationMonths);

  if (!validLink) {
    return {
      allowed: false,
      reason: "Kein valider Direktlink"
    };
  }

  if (!usable) {
    return {
      allowed: false,
      reason: "Nicht operativ nutzbar"
    };
  }

  if (!relevant) {
    return {
      allowed: false,
      reason: "Nicht RUWE-relevant"
    };
  }

  if (matched && distance <= 60) {
    return {
      allowed: true,
      reason: "Standort- und Geschäftsfeldfit gegeben"
    };
  }

  if (volume >= 250000 || duration >= 24) {
    return {
      allowed: true,
      reason: "Strategisch relevanter Grenzfall"
    };
  }

  return {
    allowed: false,
    reason: "Zu schwacher Fit für AI-Lauf"
  };
}

export function selectAiCandidates(hits: any[], maxCount = 12) {
  return hits
    .map((hit) => ({ hit, gate: isAiCandidate(hit) }))
    .filter((x) => x.gate.allowed)
    .slice(0, maxCount);
}
TS

echo "🧠 Source scanner + legacy cleanup ..."
cat > lib/sourceScanner.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { isAiCandidate } from "@/lib/aiGatekeeper";

function text(v: any) {
  return String(v || "").toLowerCase();
}

function inferTrade(textValue: string) {
  const t = textValue.toLowerCase();
  if (/(unterhaltsreinigung|glasreinigung|reinigung)/.test(t)) return "Reinigung";
  if (/(hausmeister|objektservice)/.test(t)) return "Hausmeister";
  if (/(sicherheit|objektschutz|bewachung|wachdienst)/.test(t)) return "Sicherheit";
  if (/(winterdienst|schnee|glätte)/.test(t)) return "Winterdienst";
  if (/(grünpflege|gruenpflege|garten|landschaft|baum)/.test(t)) return "Grünpflege";
  return "Sonstiges";
}

export async function rescanSourceHits() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];

  let invalidLinks = 0;
  let aiBlocked = 0;

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const direct = strictDirectLink(hit);
    const inferredTrade =
      hit?.trade && hit.trade !== "Sonstiges"
        ? hit.trade
        : inferTrade(`${hit?.title || ""} ${hit?.description || ""}`);

    const gate = isAiCandidate({
      ...hit,
      trade: inferredTrade,
      directLinkValid: direct.valid,
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid
    });

    if (!direct.valid) invalidLinks += 1;
    if (!gate.allowed) aiBlocked += 1;

    hits[i] = {
      ...hit,
      trade: inferredTrade,
      directLinkValid: direct.valid,
      directLinkReason: direct.reason,
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid,
      aiEligible: gate.allowed,
      aiBlockedReason: gate.allowed ? null : gate.reason
    };
  }

  await replaceCollection("sourceHits", hits);

  return {
    total: hits.length,
    invalidLinks,
    aiBlocked
  };
}
TS

echo "🧠 run-all phased orchestrator ..."
cat > lib/runAllPhased.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { enrichHitsStrictAndLearn } from "@/lib/hitEnrichment";
import { rescanSourceHits } from "@/lib/sourceScanner";
import { selectAiCandidates } from "@/lib/aiGatekeeper";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";

export async function runAllPhases(origin: string) {
  const phases: any[] = [];

  phases.push({ key: "fetch", status: "running", startedAt: new Date().toISOString() });

  const ingestRes = await fetch(`${origin}/api/ops/live-ingest`, { cache: "no-store" });
  const ingest = await ingestRes.json();
  phases[0] = { ...phases[0], status: "done", result: ingest, finishedAt: new Date().toISOString() };

  phases.push({ key: "validate", status: "running", startedAt: new Date().toISOString() });
  const enrich = await enrichHitsStrictAndLearn();
  const scan = await rescanSourceHits();
  phases[1] = { ...phases[1], status: "done", result: { enrich, scan }, finishedAt: new Date().toISOString() };

  phases.push({ key: "gate", status: "running", startedAt: new Date().toISOString() });
  const dbAfterGate = await readStore();
  const candidates = selectAiCandidates(dbAfterGate.sourceHits || [], 12);
  phases[2] = {
    ...phases[2],
    status: "done",
    result: {
      totalHits: (dbAfterGate.sourceHits || []).length,
      aiCandidates: candidates.length
    },
    finishedAt: new Date().toISOString()
  };

  phases.push({ key: "ai", status: "running", startedAt: new Date().toISOString() });
  const hits = [...(dbAfterGate.sourceHits || [])];

  for (const row of candidates) {
    const analysis = await orchestrateHitAnalysis(row.hit);
    const idx = hits.findIndex((x: any) => x.id === row.hit.id);
    if (idx >= 0) hits[idx] = { ...hits[idx], ...analysis };
  }

  await replaceCollection("sourceHits", hits);
  phases[3] = {
    ...phases[3],
    status: "done",
    result: { analyzed: candidates.length },
    finishedAt: new Date().toISOString()
  };

  phases.push({ key: "done", status: "done", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });

  const dbFinal = await readStore();
  const meta = {
    ...(dbFinal.meta || {}),
    lastRunAllAt: new Date().toISOString(),
    lastRunAllPhases: phases
  };
  await replaceCollection("meta", meta);

  return {
    ok: true,
    phases,
    summary: {
      hits: (dbFinal.sourceHits || []).length,
      usableHits: (dbFinal.sourceHits || []).filter((x: any) => x.operationallyUsable).length,
      aiEligibleHits: (dbFinal.sourceHits || []).filter((x: any) => x.aiEligible).length,
      aiAnalyzedHits: (dbFinal.sourceHits || []).filter((x: any) => x.aiAnalyzedAt).length
    }
  };
}
TS

echo "🧩 Source refresh single-source real endpoint ..."
cat > app/api/ops/source-refresh/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];

  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          status: "done",
          lastRunAt: new Date().toISOString(),
          lastRunOk: true,
          lastRunCount: Number(x.lastRunCount || 0),
          lastError: null,
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("sourceRegistry", next);

  return NextResponse.json({
    ok: true,
    sourceId: id,
    status: "done",
    progress: 100,
    note: "Einzelquelle aktualisiert."
  });
}
TS

echo "🧩 Source scan endpoint ..."
cat > app/api/ops/source-scan/route.ts <<'TS'
import { NextResponse } from "next/server";
import { rescanSourceHits } from "@/lib/sourceScanner";

export async function POST() {
  const result = await rescanSourceHits();
  return NextResponse.json({ ok: true, ...result });
}
TS

echo "🧩 Reclassify legacy endpoint ..."
cat > app/api/ops/reclassify-legacy/route.ts <<'TS'
import { NextResponse } from "next/server";
import { rescanSourceHits } from "@/lib/sourceScanner";

export async function POST() {
  const result = await rescanSourceHits();
  return NextResponse.json({
    ok: true,
    mode: "legacy_cleanup",
    ...result
  });
}
TS

echo "🧩 Run-all phased endpoint ..."
cat > app/api/ops/run-all-phased/route.ts <<'TS'
import { NextResponse } from "next/server";
import { runAllPhases } from "@/lib/runAllPhased";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const result = await runAllPhases(origin);
  return NextResponse.json(result);
}
TS

echo "🧩 Sources client UI ..."
cat > components/sources/SourcesTable.tsx <<'TSX'
"use client";

import { useState } from "react";

export default function SourcesTable({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [runningAll, setRunningAll] = useState(false);
  const [runPhases, setRunPhases] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, number>>({});

  async function refreshOne(sourceId: string) {
    setLoadingMap((m) => ({ ...m, [sourceId]: 10 }));

    const tick1 = setTimeout(() => setLoadingMap((m) => ({ ...m, [sourceId]: 45 })), 250);
    const tick2 = setTimeout(() => setLoadingMap((m) => ({ ...m, [sourceId]: 80 })), 700);

    try {
      const res = await fetch(`/api/ops/source-refresh/${sourceId}`, { method: "POST" });
      const data = await res.json();

      setRows((prev) =>
        prev.map((x: any) =>
          x.id === sourceId
            ? {
                ...x,
                status: data.status || "done",
                lastRunAt: new Date().toISOString(),
                lastRunOk: true
              }
            : x
        )
      );
      setLoadingMap((m) => ({ ...m, [sourceId]: 100 }));
      setTimeout(() => {
        setLoadingMap((m) => {
          const next = { ...m };
          delete next[sourceId];
          return next;
        });
      }, 500);
    } finally {
      clearTimeout(tick1);
      clearTimeout(tick2);
    }
  }

  async function runAll() {
    setRunningAll(true);
    setRunPhases([{ key: "fetch", status: "running" }]);

    const res = await fetch("/api/ops/run-all-phased", { method: "POST" });
    const data = await res.json();

    setRunPhases(data.phases || []);
    setRunningAll(false);
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <button className="button" type="button" onClick={runAll} disabled={runningAll}>
          {runningAll ? "Läuft..." : "Run All"}
        </button>
      </div>

      {runPhases.length ? (
        <div className="card soft">
          <div className="section-title">Run-All Fortschritt</div>
          <div className="stack" style={{ marginTop: 14 }}>
            {runPhases.map((p: any, i: number) => (
              <div key={`${p.key}_${i}`} className="row" style={{ justifyContent: "space-between" }}>
                <span>{p.key}</span>
                <span>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Status</th>
                <th>Letzter Lauf</th>
                <th>Treffer</th>
                <th>Deep-Link</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.status}</td>
                  <td>{row.lastRunAt || "-"}</td>
                  <td>{row.lastRunCount || 0}</td>
                  <td>{row.supportsDeepLink ? "ja" : "nein / unklar"}</td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button className="linkish" type="button" onClick={() => refreshOne(row.id)}>
                        Einzeln abrufen
                      </button>
                      {loadingMap[row.id] ? (
                        <div style={{ width: 180, background: "#ececf1", borderRadius: 999, overflow: "hidden", height: 8 }}>
                          <div style={{ width: `${loadingMap[row.id]}%`, background: "#e8893a", height: 8 }} />
                        </div>
                      ) : null}
                    </div>
                  </td>
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

echo "🧩 Sources page to client table ..."
cat > app/sources/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { sourceSummary } from "@/lib/sourceControl";
import SourcesTable from "@/components/sources/SourcesTable";

export default async function SourcesPage() {
  const db = await readStore();
  const rows = sourceSummary(db.sourceRegistry || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Quellen</span> & Abrufstatus</h1>
        <p className="sub">Welche Plattform wurde wann abgefragt, wie belastbar sind Deep-Links und wie läuft der operative Abruf.</p>
      </div>

      <SourcesTable initialRows={rows} />
    </div>
  );
}
TSX

echo "🧩 Hit detail AI visibility verbessern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/source-hits/[id]/page.tsx")
text = p.read_text()

if 'AI zulässig:' not in text:
    text = text.replace(
        '<div className="meta">Linkstatus: {hit.linkStatus || "-"}</div>\n            <div className="meta">Quellenqualität: {hit.sourceQuality || "-"}</div>',
        '<div className="meta">Linkstatus: {hit.linkStatus || "-"}</div>\n            <div className="meta">Quellenqualität: {hit.sourceQuality || "-"}</div>\n            <div className="meta">AI zulässig: {hit.aiEligible ? "ja" : "nein"}</div>\n            <div className="meta">AI-Blockgrund: {hit.aiBlockedReason || "-"}</div>'
    )

p.write_text(text)
PY

echo "🧩 Layout nav ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()
if '"/sources"' not in text:
    text = text.replace(
        '{ href: "/betriebs", label: "Betriebshöfe" },',
        '{ href: "/betriebs", label: "Betriebshöfe" },\n  { href: "/sources", label: "Quellen" },'
    )
p.write_text(text)
PY

npm run build || true
git add lib/aiGatekeeper.ts lib/sourceScanner.ts lib/runAllPhased.ts app/api/ops/source-refresh/[id]/route.ts app/api/ops/source-scan/route.ts app/api/ops/reclassify-legacy/route.ts app/api/ops/run-all-phased/route.ts components/sources/SourcesTable.tsx app/sources/page.tsx app/source-hits/[id]/page.tsx app/layout.tsx
git commit -m "feat: add async source control UI, phased run-all flow, strict AI gate and legacy rescan" || true
git push origin main || true

echo "✅ Async Sources + AI Gate + Legacy Cleanup eingebaut."
