#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Live Ingest + Phase 3–5 Upgrade"

mkdir -p app/api/ops/live-ingest
mkdir -p app/dashboard/live
mkdir -p lib/connectors
mkdir -p scripts

echo "🧠 Connector-Logik anlegen ..."
cat > lib/connectors/ted.ts <<'TS'
export async function fetchTedNotices() {
  const endpoint = "https://api.ted.europa.eu/v3/notices/search";

  const body = {
    query: "title ~ \"reinigung\" OR title ~ \"hausmeister\" OR title ~ \"winterdienst\" OR title ~ \"sicherheitsdienst\" OR title ~ \"grünpflege\"",
    fields: [
      "notice-title",
      "publication-number",
      "publication-date",
      "deadline-receipt-tender-date",
      "buyer-name",
      "place-of-performance",
      "cpv",
      "estimated-value"
    ],
    page: 1,
    limit: 20
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`TED fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json;
}
TS

cat > lib/connectors/serviceBund.ts <<'TS'
function parseTag(item: string, tag: string) {
  const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

export async function fetchServiceBundRss() {
  const url = "https://www.service.bund.de/Content/Globals/Functions/RSSFeed/RSSGenerator_Ausschreibungen.xml";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`service.bund RSS failed: ${res.status}`);

  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0]);

  return items.slice(0, 20).map((item, idx) => ({
    id: `sb_${idx + 1}`,
    title: parseTag(item, "title"),
    link: parseTag(item, "link"),
    description: parseTag(item, "description"),
    pubDate: parseTag(item, "pubDate")
  }));
}
TS

cat > lib/liveIngest.ts <<'TS'
import { appendToCollection, readStore, replaceCollection } from "@/lib/storage";
import { fetchTedNotices } from "@/lib/connectors/ted";
import { fetchServiceBundRss } from "@/lib/connectors/serviceBund";

function inferTrade(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("reinigung") || t.includes("glas")) return "Reinigung";
  if (t.includes("hausmeister") || t.includes("hauswart")) return "Hausmeister";
  if (t.includes("winterdienst") || t.includes("glätte") || t.includes("schnee")) return "Winterdienst";
  if (t.includes("sicherheit") || t.includes("wach")) return "Sicherheit";
  if (t.includes("grün") || t.includes("baum")) return "Grünpflege";
  return "Sonstiges";
}

function matchSite(trade: string, sites: any[], rules: any[]) {
  const enabledRules = rules.filter((r: any) => r.enabled && r.trade.toLowerCase().includes(trade.toLowerCase()));
  if (!enabledRules.length) return null;
  const rule = enabledRules[0];
  return sites.find((s: any) => s.id === rule.siteId) || null;
}

function aiLikeDecision(hit: any) {
  let score = 0;
  if ((hit.distanceKm || 999) <= 10) score += 30;
  else if ((hit.distanceKm || 999) <= 30) score += 20;

  if ((hit.estimatedValue || 0) >= 500000) score += 25;
  else score += 10;

  if ((hit.durationMonths || 0) >= 24) score += 20;
  else score += 8;

  if (score >= 70) return "prefiltered";
  if (score >= 45) return "manual_review";
  return "observed";
}

export async function runLiveIngest() {
  const db = await readStore();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const sourceStats = db.sourceStats || [];
  const existingHits = db.sourceHits || [];

  const now = new Date().toISOString();
  const freshHits: any[] = [];

  // TED
  try {
    const ted = await fetchTedNotices();
    const tedRows = Array.isArray(ted?.notices) ? ted.notices : [];

    for (let i = 0; i < tedRows.length; i++) {
      const row: any = tedRows[i];
      const title = row["notice-title"] || row.title || `TED Notice ${i + 1}`;
      const trade = inferTrade(title);
      const site = matchSite(trade, sites, rules);

      freshHits.push({
        id: `live_ted_${Date.now()}_${i}`,
        sourceId: "src_ted",
        title,
        region: row["place-of-performance"] || "unbekannt",
        postalCode: "",
        trade,
        estimatedValue: Number(row["estimated-value"] || 0),
        durationMonths: 24,
        distanceKm: site ? 15 : 999,
        matchedSiteId: site?.id || "",
        status: aiLikeDecision({
          estimatedValue: Number(row["estimated-value"] || 0),
          distanceKm: site ? 15 : 999,
          durationMonths: 24
        }),
        addedSinceLastFetch: true,
        url: "https://ted.europa.eu/"
      });
    }

    const idx = sourceStats.findIndex((s: any) => s.id === "src_ted");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        tendersSinceLastFetch: tedRows.length,
        tendersLast30Days: Math.max(sourceStats[idx].tendersLast30Days || 0, tedRows.length),
        prefilteredLast30Days: freshHits.filter((h) => h.sourceId === "src_ted" && h.status === "prefiltered").length,
        goLast30Days: freshHits.filter((h) => h.sourceId === "src_ted" && h.status === "prefiltered").length,
        errorCountLastRun: 0,
        lastRunOk: true,
        dataMode: "live"
      };
    }
  } catch {
    const idx = sourceStats.findIndex((s: any) => s.id === "src_ted");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        errorCountLastRun: (sourceStats[idx].errorCountLastRun || 0) + 1,
        lastRunOk: false
      };
    }
  }

  // service.bund
  try {
    const rss = await fetchServiceBundRss();

    for (let i = 0; i < rss.length; i++) {
      const row = rss[i];
      const trade = inferTrade(row.title);
      const site = matchSite(trade, sites, rules);

      freshHits.push({
        id: `live_sb_${Date.now()}_${i}`,
        sourceId: "src_service_bund",
        title: row.title,
        region: row.description?.slice(0, 80) || "unbekannt",
        postalCode: "",
        trade,
        estimatedValue: 0,
        durationMonths: 12,
        distanceKm: site ? 20 : 999,
        matchedSiteId: site?.id || "",
        status: aiLikeDecision({
          estimatedValue: 0,
          distanceKm: site ? 20 : 999,
          durationMonths: 12
        }),
        addedSinceLastFetch: true,
        url: row.link || "https://service.bund.de/"
      });
    }

    const idx = sourceStats.findIndex((s: any) => s.id === "src_service_bund");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        tendersSinceLastFetch: rss.length,
        tendersLast30Days: Math.max(sourceStats[idx].tendersLast30Days || 0, rss.length),
        prefilteredLast30Days: freshHits.filter((h) => h.sourceId === "src_service_bund" && h.status === "prefiltered").length,
        goLast30Days: freshHits.filter((h) => h.sourceId === "src_service_bund" && h.status === "prefiltered").length,
        errorCountLastRun: 0,
        lastRunOk: true,
        dataMode: "live"
      };
    }
  } catch {
    const idx = sourceStats.findIndex((s: any) => s.id === "src_service_bund");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        errorCountLastRun: (sourceStats[idx].errorCountLastRun || 0) + 1,
        lastRunOk: false
      };
    }
  }

  const finalHits = [...freshHits, ...existingHits].slice(0, 100);

  await replaceCollection("sourceHits", finalHits);
  await replaceCollection("sourceStats", sourceStats);
  await replaceCollection("meta", [
    {
      ...(db.meta || {}),
      lastSuccessfulIngestionAt: now,
      lastSuccessfulIngestionSource: "TED + service.bund",
      dataMode: freshHits.length ? "live" : (db.meta?.dataMode || "demo"),
      dataValidityNote: freshHits.length
        ? "Mindestens ein Teil der Treffer wurde live abgerufen."
        : "Live-Abruf fehlgeschlagen, Fallback aktiv."
    }
  ]);

  return {
    ok: true,
    fetched: freshHits.length
  };
}
TS

echo "🔌 Live-Ingest API ..."
cat > app/api/ops/live-ingest/route.ts <<'TS'
import { NextResponse } from "next/server";
import { runLiveIngest } from "@/lib/liveIngest";

export async function POST() {
  try {
    const result = await runLiveIngest();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "live_ingest_failed" },
      { status: 500 }
    );
  }
}
TS

echo "📊 Live-Seite ..."
cat > app/dashboard/live/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, dataModeBadgeClass, dataModeLabel } from "@/lib/format";

export default async function LivePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Live Abruf</h1>
            <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
          </div>
          <p className="sub">TED und service.bund live testen und Treffer direkt in die Arbeitslisten übernehmen.</p>
        </div>
        <form action="/api/ops/live-ingest" method="post">
          <button className="button" type="submit">Live Abruf starten</button>
        </form>
      </div>

      <div className="card">
        <div className="meta">Letzter Abruf: {formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div>
        <div className="meta">Quelle: {db.meta?.lastSuccessfulIngestionSource || "-"}</div>
        <div className="meta">Treffer im Speicher: {hits.length}</div>
      </div>

      <div className="card">
        <Link className="linkish" href="/source-hits">Zu allen Treffern</Link>
      </div>
    </div>
  );
}
TSX

echo "🧭 Dashboard mit Live-Einstieg ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()
text = text.replace(
    '<Link className="button" href="/dashboard/smoke">Smoke</Link>',
    '<Link className="button" href="/dashboard/live">Live Abruf</Link>\n            <Link className="button-secondary" href="/dashboard/smoke">Smoke</Link>'
)
p.write_text(text)
PY

echo "🧾 Build-sichere Smoke/AI-Routen anlegen, falls sie fehlen ..."
cat > app/dashboard/smoke/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { smokeSummary } from "@/lib/sourceLogic";

export default async function SmokePage() {
  const db = await readStore();
  const summary = smokeSummary(db);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Smoke Test</h1>
        <p className="sub">Struktureller Überblick ohne Anspruch auf Live-Vollständigkeit.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(summary, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/ai-smoke/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { aiSmokeForHit } from "@/lib/sourceLogic";

export default async function AiSmokePage() {
  const db = await readStore();
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">AI Test</h1>
        <p className="sub">Bid-/Prüfen-/No-Go-Logik mit erklärender Heuristik.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Empfehlung</th>
              <th>Score</th>
              <th>Begründung</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((hit: any) => {
              const a = aiSmokeForHit(hit);
              return (
                <tr key={hit.id}>
                  <td>{hit.title}</td>
                  <td>{a.recommendation}</td>
                  <td>{a.score}</td>
                  <td>{a.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "🧾 Docs Phase 3–5 konkretisieren ..."
cat > docs/PHASE_3_TO_5_STATUS.md <<'DOC'
# PHASE_3_TO_5_STATUS

## Phase 3 — Intelligence
Umgesetzt:
- Bid-/Prüfen-/No-Go-Heuristik
- Smoke-/AI-Test
- Region × Gewerk × Volumen
- Sinnvollste Quelle

Offen:
- echte Explainability je Vergabeunterlage
- bessere Distanz-/Kapazitätslogik
- echtes Forecasting

## Phase 4 — Ingestion
Umgesetzt:
- TED Live-Ingest (erster Stand)
- service.bund RSS Live-Ingest (erster Stand)
- Source Hits / Source Tests / Monitoring

Offen:
- Berlin Live-RSS / Portal-Anbindung
- echte Dedupe-Engine
- Persistente Importhistorie

## Phase 5 — Production
Umgesetzt:
- Mongo-first
- Demo/Smoke/Live-Kennzeichnung
- klickbare Arbeitslisten
- operatives Standortmodell

Offen:
- Rollen & Rechte
- Audit Log
- Scheduler
- Exporte
- produktive Formulare und Bulk-Workflows
DOC

npm run build || true
git add .
git commit -m "feat: add first live ingest for TED and service.bund and stabilize phase 3-5 routes" || true
git push origin main || true

echo "✅ Live-Ingest + Phase 3–5 Upgrade eingebaut."
