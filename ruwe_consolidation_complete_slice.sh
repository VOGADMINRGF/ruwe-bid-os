#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Consolidation Slice"

mkdir -p app/betriebslogik
mkdir -p app/quellensteuerung
mkdir -p components/logic
mkdir -p components/sourcecontrol
mkdir -p lib

echo "🧠 Betriebslogik Aggregation ..."
cat > lib/betriebslogik.ts <<'TS'
import { readStore } from "@/lib/storage";

export async function listBetriebslogikCards() {
  const db = await readStore();
  const sites = Array.isArray(db.sites) ? db.sites : [];
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];

  return rules.map((rule: any) => {
    const site = sites.find((s: any) => s.id === rule.siteId);

    return {
      id: rule.id,
      siteId: rule.siteId,
      siteName: site?.name || rule.siteId || "Standort",
      city: site?.city || "",
      trade: rule.trade || "",
      priority: rule.priority || "mittel",
      enabled: rule.enabled !== false,
      primaryRadiusKm: rule.primaryRadiusKm ?? 0,
      secondaryRadiusKm: rule.secondaryRadiusKm ?? 0,
      tertiaryRadiusKm: rule.tertiaryRadiusKm ?? 0,
      monthlyCapacity: rule.monthlyCapacity ?? 0,
      concurrentCapacity: rule.concurrentCapacity ?? 0,
      keywordsPositive: Array.isArray(rule.keywordsPositive) ? rule.keywordsPositive : [],
      keywordsNegative: Array.isArray(rule.keywordsNegative) ? rule.keywordsNegative : [],
      regionNotes: rule.regionNotes || "",
      generatedQueries: buildSuggestedQueries(rule.trade, site)
    };
  });
}

function buildSuggestedQueries(trade: string, site: any) {
  const city = site?.city || "";
  const state = site?.state || "";
  const out = new Set<string>();

  if (trade) out.add(trade);
  if (trade && city) out.add(`${trade} ${city}`);
  if (trade && state) out.add(`${trade} ${state}`);

  const map: Record<string, string[]> = {
    Winterdienst: ["Schneeräumung", "Glättebeseitigung"],
    Reinigung: ["Unterhaltsreinigung", "Gebäudereinigung"],
    Glasreinigung: ["Fensterreinigung"],
    Hausmeister: ["Objektservice", "Hauswart"],
    Sicherheit: ["Objektschutz", "Wachdienst"],
    Grünpflege: ["Gartenpflege", "Landschaftspflege"]
  };

  for (const synonym of map[trade] || []) {
    out.add(synonym);
    if (city) out.add(`${synonym} ${city}`);
  }

  return [...out];
}
TS

echo "🧠 Quellensteuerung Aggregation ..."
cat > lib/quellensteuerung.ts <<'TS'
import { readStore } from "@/lib/storage";

function sameSource(hit: any, sourceId: string) {
  return String(hit?.sourceId || "") === String(sourceId || "");
}

export async function buildQuellensteuerung() {
  const db = await readStore();
  const registry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const stats = Array.isArray(db.sourceStats) ? db.sourceStats : [];
  const connectors = Array.isArray(db.connectors) ? db.connectors : [];
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const meta = db.meta || {};

  const rows = registry.map((src: any) => {
    const hitRows = hits.filter((h: any) => sameSource(h, src.id));
    const statRow = stats.find((s: any) => s.id === src.id || s.sourceId === src.id) || {};
    const conn = connectors.find((c: any) => c.id === src.id) || {};

    const validLinks = hitRows.filter((h: any) => h.directLinkValid === true).length;
    const aiEligible = hitRows.filter((h: any) => h.aiEligible === true).length;
    const operational = hitRows.filter((h: any) => h.operationallyUsable !== false).length;

    return {
      id: src.id,
      name: src.name || src.id,
      status: src.status || conn.status || "idle",
      lastRunAt: src.lastRunAt || "-",
      hitsLastRun: Number(src.lastRunCount || 0),
      hitsTotal: hitRows.length,
      validLinks,
      aiEligible,
      operational,
      deepLinkStatus:
        hitRows.length === 0 ? "noch offen" :
        validLinks === 0 ? "nicht belastbar" :
        validLinks < hitRows.length ? "teilweise" : "voll",
      supportsQuerySearch: conn.supportsQuerySearch === true,
      supportsDeepLink: conn.supportsDeepLink === true,
      lastTestOk: conn.lastTestOk,
      lastTestAt: conn.lastTestAt || null,
      lastTestMessage: conn.lastTestMessage || null,
      score: statRow.score ?? src.score ?? 0
    };
  });

  return {
    rows,
    summary: {
      lastRunAllAt: meta.lastRunAllAt || null,
      sourceCount: rows.length,
      totalHits: rows.reduce((s: number, x: any) => s + x.hitsTotal, 0),
      totalValidLinks: rows.reduce((s: number, x: any) => s + x.validLinks, 0),
      totalAiEligible: rows.reduce((s: number, x: any) => s + x.aiEligible, 0)
    }
  };
}
TS

echo "🧩 Betriebslogik page ..."
cat > app/betriebslogik/page.tsx <<'TSX'
import { listBetriebslogikCards } from "@/lib/betriebslogik";

export default async function BetriebslogikPage() {
  const rows = await listBetriebslogikCards();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Betriebs</span>logik</h1>
        <p className="sub">Radius, Kapazität, Priorität, Keywords und regionale Hinweise pro Standort und Gewerk in einer gemeinsamen Oberfläche.</p>
      </div>

      <div className="grid grid-2">
        {rows.map((row: any) => (
          <div className="card" key={row.id}>
            <div className="section-title">{row.siteName} · {row.trade}</div>
            <div className="meta" style={{ marginTop: 10 }}>{row.city || "-"}</div>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="label">Priorität</div>
                <div>{row.priority}</div>
              </div>
              <div>
                <div className="label">Aktiv</div>
                <div>{row.enabled ? "Ja" : "Nein"}</div>
              </div>
              <div>
                <div className="label">Kapazität</div>
                <div>{row.monthlyCapacity} / {row.concurrentCapacity}</div>
              </div>
            </div>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="label">Primär</div>
                <div>{row.primaryRadiusKm} km</div>
              </div>
              <div>
                <div className="label">Sekundär</div>
                <div>{row.secondaryRadiusKm} km</div>
              </div>
              <div>
                <div className="label">Tertiär</div>
                <div>{row.tertiaryRadiusKm} km</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="label">Positive Keywords</div>
              <div>{row.keywordsPositive.length ? row.keywordsPositive.join(", ") : "-"}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Negative Keywords</div>
              <div>{row.keywordsNegative.length ? row.keywordsNegative.join(", ") : "-"}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Regionshinweis</div>
              <div>{row.regionNotes || "-"}</div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="label">Generierte Suchabfragen</div>
              <div style={{ marginTop: 8 }}>
                {row.generatedQueries.map((q: string) => (
                  <span key={q} className="badge" style={{ marginRight: 8, marginBottom: 8 }}>{q}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TSX

echo "🧩 Quellensteuerung page ..."
cat > app/quellensteuerung/page.tsx <<'TSX'
import { buildQuellensteuerung } from "@/lib/quellensteuerung";
import SourcesTable from "@/components/sources/SourcesTable";

export default async function QuellensteuerungPage() {
  const data = await buildQuellensteuerung();

  const sourceRows = data.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    lastRunAt: row.lastRunAt,
    lastRunCount: row.hitsLastRun,
    supportsDeepLink: row.supportsDeepLink
  }));

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Quellen</span>steuerung</h1>
        <p className="sub">Abruf, Status, Query-Fähigkeit, Deep-Link-Güte, Testlauf und operative Nutzbarkeit in einer gemeinsamen Konsole.</p>
      </div>

      <div className="grid grid-4">
        <div className="card">
          <div className="label">Quellen</div>
          <div className="kpi-compact">{data.summary.sourceCount}</div>
        </div>
        <div className="card">
          <div className="label">Treffer gesamt</div>
          <div className="kpi-compact">{data.summary.totalHits}</div>
        </div>
        <div className="card">
          <div className="label">Valide Links</div>
          <div className="kpi-compact">{data.summary.totalValidLinks}</div>
        </div>
        <div className="card">
          <div className="label">AI-fähig</div>
          <div className="kpi-compact">{data.summary.totalAiEligible}</div>
        </div>
      </div>

      <SourcesTable initialRows={sourceRows} />

      <div className="card">
        <div className="section-title">Quellenstatus im Detail</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Treffer gesamt</th>
                <th>Valide Links</th>
                <th>Operativ</th>
                <th>AI-fähig</th>
                <th>Deep-Link-Güte</th>
                <th>Query</th>
                <th>Test</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.hitsTotal}</td>
                  <td>{row.validLinks}</td>
                  <td>{row.operational}</td>
                  <td>{row.aiEligible}</td>
                  <td>{row.deepLinkStatus}</td>
                  <td>{row.supportsQuerySearch ? "ja" : "nein"}</td>
                  <td>{row.lastTestOk === true ? "ok" : row.lastTestOk === false ? "offen" : "-"}</td>
                  <td>{row.score}</td>
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

echo "🧩 Redirects für Altseiten ..."
cat > app/site-rules/page.tsx <<'TSX'
import { redirect } from "next/navigation";

export default function SiteRulesRedirectPage() {
  redirect("/betriebslogik");
}
TSX

cat > app/keywords/page.tsx <<'TSX'
import { redirect } from "next/navigation";

export default function KeywordsRedirectPage() {
  redirect("/betriebslogik");
}
TSX

cat > app/sources/page.tsx <<'TSX'
import { redirect } from "next/navigation";

export default function SourcesRedirectPage() {
  redirect("/quellensteuerung");
}
TSX

cat > app/monitoring/page.tsx <<'TSX'
import { redirect } from "next/navigation";

export default function MonitoringRedirectPage() {
  redirect("/quellensteuerung");
}
TSX

cat > app/ops/page.tsx <<'TSX'
import { redirect } from "next/navigation";

export default function OpsRedirectPage() {
  redirect("/quellensteuerung");
}
TSX

echo "🧩 Navigation anpassen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()

text = text.replace('{ href: "/sources", label: "Quellen" },', '{ href: "/quellensteuerung", label: "Quellensteuerung" },')
text = text.replace('{ href: "/monitoring", label: "Monitoring" },', '')
text = text.replace('{ href: "/ops", label: "Ops" },', '')
text = text.replace('{ href: "/site-rules", label: "Regeln" },', '{ href: "/betriebslogik", label: "Betriebslogik" },')
text = text.replace('{ href: "/keywords", label: "Keywords" },', '')

p.write_text(text)
PY

npm run build || true
git add lib/betriebslogik.ts lib/quellensteuerung.ts app/betriebslogik/page.tsx app/quellensteuerung/page.tsx app/site-rules/page.tsx app/keywords/page.tsx app/sources/page.tsx app/monitoring/page.tsx app/ops/page.tsx app/layout.tsx
git commit -m "feat: consolidate rules and keywords into betriebslogik and sources monitoring ops into quellensteuerung" || true
git push origin main || true

echo "✅ Consolidation Slice eingebaut."
