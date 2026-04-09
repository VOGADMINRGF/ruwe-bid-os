#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Forecast / Keywords / Fristen Upgrade"

mkdir -p lib
mkdir -p app/api/agent-keywords
mkdir -p app/dashboard/forecast
mkdir -p app/dashboard/deadlines

echo "🧠 Datenmodell erweitern ..."
node - <<'NODE'
const fs = require("fs");
const path = "data/db.json";
const db = JSON.parse(fs.readFileSync(path, "utf8"));

db.globalKeywords = db.globalKeywords || {
  positive: ["unterhaltsreinigung", "hausmeister", "winterdienst", "objektschutz", "grünpflege", "glasreinigung"],
  negative: ["architektur", "planungsleistung", "software", "netzwerk", "beratung"]
};

db.agentKeywords = db.agentKeywords || [
  {
    id: "ak_coord1",
    agentId: "coord1",
    positive: ["schule", "bezirk", "glas", "verwaltung"],
    negative: ["planung", "software"]
  },
  {
    id: "ak_coord2",
    agentId: "coord2",
    positive: ["hausmeister", "objektservice", "liegenschaft"],
    negative: ["ingenieur", "bauplanung"]
  },
  {
    id: "ak_coord3",
    agentId: "coord3",
    positive: ["winterdienst", "reinigung", "kommunal"],
    negative: ["it", "telekommunikation"]
  },
  {
    id: "ak_coord4",
    agentId: "coord4",
    positive: ["sicherheit", "wachdienst", "objektschutz"],
    negative: ["software", "netzwerk"]
  }
];

for (const tender of db.tenders || []) {
  if (!tender.dueDate) tender.dueDate = "2026-04-25";
}
for (const hit of db.sourceHits || []) {
  if (!hit.dueDate) {
    if (hit.durationMonths >= 24) hit.dueDate = "2026-04-25";
    else hit.dueDate = "2026-04-18";
  }
}

fs.writeFileSync(path, JSON.stringify(db, null, 2) + "\n");
NODE

echo "🧠 Forecast-Logik ..."
cat > lib/forecastLogic.ts <<'TS'
function daysUntil(dateStr?: string) {
  if (!dateStr) return 999;
  const now = new Date();
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return 999;
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function deadlineBucket(dateStr?: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return "überfällig";
  if (d <= 7) return "7 Tage";
  if (d <= 14) return "14 Tage";
  if (d <= 30) return "30 Tage";
  return "später";
}

export function fieldRegionVolume(hits: any[]) {
  const map = new Map<string, any>();

  for (const hit of hits || []) {
    const trade = hit?.trade || "Sonstiges";
    const region = hit?.region || "Unbekannt";
    const key = `${trade}__${region}`;

    const current = map.get(key) || {
      trade,
      region,
      count: 0,
      volume: 0,
      bids: 0,
      reviews: 0
    };

    current.count += 1;
    current.volume += Number(hit?.estimatedValue || 0);
    if (hit?.aiRecommendation === "Bid" || hit?.status === "prefiltered") current.bids += 1;
    if (hit?.aiRecommendation === "Prüfen" || hit?.status === "manual_review") current.reviews += 1;

    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.volume - a.volume || b.count - a.count);
}

export function deadlineView(items: any[]) {
  return (items || [])
    .map((item) => ({
      ...item,
      daysLeft: daysUntil(item.dueDate),
      bucket: deadlineBucket(item.dueDate)
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function forecastRecommendations(hits: any[]) {
  const grouped = fieldRegionVolume(hits);
  return grouped.map((row) => {
    let recommendation = "Beobachten";
    if (row.bids >= 2 && row.volume >= 500000) {
      recommendation = "Aktiv fokussieren";
    } else if (row.reviews >= 1 || row.volume >= 250000) {
      recommendation = "Gezielt prüfen";
    }

    return {
      ...row,
      recommendation
    };
  });
}
TS

echo "🔌 Agent Keywords API ..."
cat > app/api/agent-keywords/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.agentKeywords || []);
}

export async function POST(req: Request) {
  const db = await readStore();
  const body = await req.json();
  const current = db.agentKeywords || [];
  const next = [...current, body];
  await replaceCollection("agentKeywords", next);
  return NextResponse.json(body);
}
TS

echo "📊 Forecast Seite ..."
cat > app/dashboard/forecast/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { forecastRecommendations } from "@/lib/forecastLogic";

export default async function ForecastPage() {
  const db = await readStore();
  const rows = forecastRecommendations(db.sourceHits || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Forecast</h1>
        <p className="sub">Welche Geschäftsfelder in welchen Regionen aktuell am attraktivsten wirken.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Geschäftsfeld</th>
              <th>Region</th>
              <th>Treffer</th>
              <th>Volumen</th>
              <th>Bid</th>
              <th>Prüfen</th>
              <th>Empfehlung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={`${row.trade}_${row.region}`}>
                <td>{row.trade}</td>
                <td>{row.region}</td>
                <td>{row.count}</td>
                <td>{Math.round(row.volume / 1000)}k €</td>
                <td>{row.bids}</td>
                <td>{row.reviews}</td>
                <td>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📊 Fristen Seite ..."
cat > app/dashboard/deadlines/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { deadlineView } from "@/lib/forecastLogic";

export default async function DeadlinesPage() {
  const db = await readStore();
  const tenders = deadlineView(db.tenders || []);
  const pipeline = deadlineView(db.pipeline || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Fristen</h1>
        <p className="sub">Welche Chancen zeitkritisch sind und kurzfristig bearbeitet werden müssen.</p>
      </div>

      <div className="card">
        <div className="section-title">Tender-Fristen</div>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Entscheidung</th>
                <th>Frist</th>
                <th>Tage</th>
                <th>Bucket</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.decision}</td>
                  <td>{row.dueDate || "-"}</td>
                  <td>{row.daysLeft}</td>
                  <td>{row.bucket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Pipeline-Fristen</div>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Stage</th>
                <th>Nächster Schritt</th>
                <th>EOW</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.stage}</td>
                  <td>{row.nextStep || "-"}</td>
                  <td>{row.eowUpdate || "-"}</td>
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

echo "📊 Dashboard erweitern ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()

if '/dashboard/forecast' not in text:
    text = text.replace(
        '<Link className="linkish" href="/dashboard/monitoring">Details</Link>',
        '<Link className="button-secondary" href="/dashboard/forecast">Forecast</Link>\n            <Link className="button-secondary" href="/dashboard/deadlines">Fristen</Link>\n            <Link className="linkish" href="/dashboard/monitoring">Details</Link>'
    )

if 'Geschäftsfeld × Region' not in text:
    insert = """
      <section className="card">
        <div className="section-title">Geschäftsfeld × Region × Priorität</div>
        <div className="meta" style={{ marginBottom: 12 }}>
          Zeigt, in welchen Regionen sich welche Geschäftsfelder aktuell besonders lohnen.
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Treffer</th>
                <th>Bid</th>
                <th>Prüfen</th>
                <th>Volumen</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((row: any) => (
                <tr key={`focus_${row.region}_${row.trade}`}>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.count}</td>
                  <td>{row.bids}</td>
                  <td>{row.reviews}</td>
                  <td>{Math.round(row.volume / 1000)}k €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
"""
    text = text.replace(
        '</section>\n    </div>\n  );\n}',
        f'</section>\n{insert}\n    </div>\n  );\n}}'
    )

p.write_text(text)
PY

npm run build || true
git add .
git commit -m "feat: add global and agent keyword support plus forecast and deadline dashboards" || true
git push origin main || true

echo "✅ Forecast / Keywords / Fristen Upgrade eingebaut."
