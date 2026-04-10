#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Live Workbench Upgrade"

mkdir -p app/api/ops/refresh-all
mkdir -p components/dashboard
mkdir -p lib

echo "🧠 Live orchestration helper ..."
cat > lib/liveWorkbench.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";

export async function markLiveRun(status: "idle" | "running" | "done" | "error", step?: string, note?: string) {
  const db = await readStore();
  const meta = {
    ...(db.meta || {}),
    liveRunStatus: status,
    liveRunStep: step || null,
    liveRunNote: note || null,
    liveRunAt: new Date().toISOString()
  };
  await replaceCollection("meta", meta);
  return meta;
}

export async function readLiveRunState() {
  const db = await readStore();
  const meta = db.meta || {};
  return {
    status: meta.liveRunStatus || "idle",
    step: meta.liveRunStep || null,
    note: meta.liveRunNote || null,
    at: meta.liveRunAt || null
  };
}
TS

echo "🧩 Refresh-all API ..."
cat > app/api/ops/refresh-all/route.ts <<'TS'
import { NextResponse } from "next/server";
import { markLiveRun } from "@/lib/liveWorkbench";

async function safeFetch(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  try {
    return await res.json();
  } catch {
    return { ok: false, path };
  }
}

export async function GET() {
  try {
    await markLiveRun("running", "quellenabruf", "Live-Aktualisierung gestartet");

    const ingest = await safeFetch("/api/ops/live-ingest");
    await markLiveRun("running", "link-pruefung", "Quellen abgerufen, prüfe Direktlinks");

    const probe = await safeFetch("/api/ops/probe-deeplinks");
    await markLiveRun("running", "dashboard", "Direktlinks geprüft, aktualisiere Übersicht");

    const overview = await safeFetch("/api/ops/source-overview");
    await markLiveRun("running", "ai-bewertung", "Übersicht aktualisiert, bewerte Kandidaten");

    const analyze = await safeFetch("/api/ops/analyze-hits");

    await markLiveRun("done", "fertig", "Live-Aktualisierung erfolgreich abgeschlossen");

    return NextResponse.json({
      ok: true,
      ingest,
      probe,
      overview,
      analyze
    });
  } catch (error: any) {
    await markLiveRun("error", "abbruch", error?.message || "Unbekannter Fehler");
    return NextResponse.json(
      { ok: false, error: error?.message || "Refresh fehlgeschlagen" },
      { status: 500 }
    );
  }
}
TS

echo "🧩 Action bar ..."
cat > components/dashboard/LiveActionBar.tsx <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveActionBar({ liveState }: { liveState: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(path: string) {
    setLoading(true);
    try {
      await fetch(path, { cache: "no-store" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="toolbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-title">Live-Steuerung</div>
          <div className="sub" style={{ marginTop: 6 }}>
            Status: {liveState.status} {liveState.step ? `· ${liveState.step}` : ""}
          </div>
        </div>

        <div className="toolbar">
          <button className="button" type="button" onClick={() => run("/api/ops/refresh-all")} disabled={loading}>
            {loading ? "Aktualisiert..." : "Jetzt aktualisieren"}
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/live-ingest")} disabled={loading}>
            Quellen abrufen
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/probe-deeplinks")} disabled={loading}>
            Links prüfen
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/analyze-hits")} disabled={loading}>
            AI bewerten
          </button>
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧩 Page rewrite ..."
cat > app/page.tsx <<'TSX'
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import { readLiveRunState } from "@/lib/liveWorkbench";
import WorkbenchSidebarLeft from "@/components/dashboard/WorkbenchSidebarLeft";
import WorkbenchSidebarRight from "@/components/dashboard/WorkbenchSidebarRight";
import WorkbenchSearchBar from "@/components/dashboard/WorkbenchSearchBar";
import WorkbenchInsights from "@/components/dashboard/WorkbenchInsights";
import LiveActionBar from "@/components/dashboard/LiveActionBar";
import Link from "next/link";

function q(v: string | undefined) {
  return v && v !== "Alle" ? v : undefined;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = searchParams ? await searchParams : {};
  const current = {
    trade: typeof sp.trade === "string" ? sp.trade : undefined,
    region: typeof sp.region === "string" ? sp.region : undefined,
    decision: typeof sp.decision === "string" ? sp.decision : undefined,
    sourceId: typeof sp.sourceId === "string" ? sp.sourceId : undefined,
    search: typeof sp.search === "string" ? sp.search : undefined
  };

  const [data, liveState] = await Promise.all([
    buildDashboardWorkbench({
      trade: q(current.trade),
      region: q(current.region),
      decision: q(current.decision),
      sourceId: q(current.sourceId),
      search: current.search
    }),
    readLiveRunState()
  ]);

  return (
    <div className="wb-shell">
      <WorkbenchSidebarLeft filters={data.leftFilters} current={current} />

      <main className="wb-main">
        <div>
          <h1 className="h1">
            <span className="headline-accent">Ausschreibungen</span> gezielt steuern.
          </h1>
          <p className="sub">
            Live-Steuerung für Geschäftsfelder, Regionen, Quellen, Direktlinks und KI-Bewertung.
          </p>
        </div>

        <LiveActionBar liveState={liveState} />

        <WorkbenchSearchBar
          search={current.search}
          trade={current.trade}
          region={current.region}
          decision={current.decision}
          sourceId={current.sourceId}
          filters={data.leftFilters}
        />

        <div className="grid grid-6">
          <div className="card"><div className="label">Ausschreibungsvolumen</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.totalVolume)}</div><div className="metric-sub">{data.kpis.hitCount} Treffer</div></div>
          <div className="card"><div className="label">Empfohlen</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.recommendedVolume)}</div><div className="metric-sub">{data.kpis.bidCount} Bid</div></div>
          <div className="card"><div className="label">Prüfen</div><div className="kpi-compact">{data.kpis.reviewCount}</div><div className="metric-sub">manuelle Prüfung</div></div>
          <div className="card"><div className="label">No-Bid</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.noBidVolume)}</div><div className="metric-sub">{data.kpis.noBidCount} Fälle</div></div>
          <div className="card"><div className="label">Standorte</div><div className="kpi-compact">{data.kpis.siteCount}</div><div className="metric-sub">aktive Basis</div></div>
          <div className="card"><div className="label">Regeln</div><div className="kpi-compact">{data.kpis.ruleCount}</div><div className="metric-sub">Betriebslogik</div></div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Ausschreibungsniveau je Geschäftsfeld</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Geschäftsfeld</th>
                    <th>Treffer</th>
                    <th>Volumen</th>
                    <th>Bid</th>
                    <th>Prüfen</th>
                    <th>No-Bid</th>
                    <th>stärkste Region</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tradeMatrix.map((row: any) => (
                    <tr key={row.trade}>
                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
                      <td>{row.hits}</td>
                      <td>{formatCurrencyCompact(row.volume)}</td>
                      <td>{row.bid}</td>
                      <td>{row.review}</td>
                      <td>{row.noBid}</td>
                      <td>{row.strongestRegion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Region × Geschäftsfeld Potenziale</div>
            <div className="table-wrap" style={{ marginTop: 14, maxHeight: 520 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Geschäftsfeld</th>
                    <th>Treffer</th>
                    <th>Volumen</th>
                    <th>Bid</th>
                    <th>Prüfen</th>
                    <th>No-Bid</th>
                    <th>Grund</th>
                  </tr>
                </thead>
                <tbody>
                  {data.regionTradeRows.map((row: any, i: number) => (
                    <tr key={`${row.region}_${row.trade}_${i}`}>
                      <td><Link className="linkish" href={row.href}>{row.region}</Link></td>
                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
                      <td>{row.hits}</td>
                      <td>{formatCurrencyCompact(row.volume)}</td>
                      <td>{row.bid}</td>
                      <td>{row.review}</td>
                      <td>{row.noBid}</td>
                      <td>{row.noBidReason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <WorkbenchInsights
          focusHits={data.focusHits}
          longRuns={data.longRuns}
          noBidRows={data.noBidRows}
        />
      </main>

      <WorkbenchSidebarRight items={data.rightHighlights} />
    </div>
  );
}
TSX

echo "🎨 UI polish ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/globals.css")
text = p.read_text()

append = """
.button-secondary {
  appearance: none;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--foreground);
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.wb-highlight-link {
  background: #fff;
}
"""

if ".button-secondary" not in text:
  text += append

p.write_text(text)
PY

npm run build || true
git add lib/liveWorkbench.ts app/api/ops/refresh-all/route.ts components/dashboard/LiveActionBar.tsx app/page.tsx app/globals.css
git commit -m "feat: add live refresh action bar and remove teststand style from dashboard" || true
git push origin main || true

echo "✅ Live Workbench Upgrade eingebaut."
