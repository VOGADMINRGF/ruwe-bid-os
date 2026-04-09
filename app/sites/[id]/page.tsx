import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { siteTradeOperationalRows } from "@/lib/siteLogic";

function capacityBadge(status: string) {
  if (status === "voll") return "badge badge-kritisch";
  if (status === "eng") return "badge badge-gemischt";
  return "badge badge-gut";
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const rules = db.siteTradeRules || [];
  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const tenders = db.tenders || [];
  const rows = siteTradeOperationalRows(site, rules, tenders);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">
          Standortdetail mit konfigurierbaren Gewerken, Radiusstufen, Kapazitäten und nächstgrößerer Klasse.
        </p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Standort</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Typ</div><div className="kpi">{site.type}</div></div>
        <div className="card"><div className="label">Primär / Sekundär</div><div className="kpi">{site.primaryRadiusKm}/{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Service Areas</div><div className="kpi">{serviceAreas.length}</div></div>
      </div>

      <div className="card">
        <div className="section-title">Service Areas</div>
        <div className="meta">{serviceAreas.map((x: any) => x.name).join(", ") || "-"}</div>
      </div>

      <div className="card">
        <div className="section-title">Gewerkeregeln & Kapazität</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Gewerk</th>
                <th>Primär</th>
                <th>Sekundär</th>
                <th>Tertiär</th>
                <th>Monat / Parallel</th>
                <th>Im Scope</th>
                <th>Nächste Klasse</th>
                <th>Manuell prüfen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.rule.id}>
                  <td>{row.rule.trade}</td>
                  <td>{row.rule.primaryRadiusKm} km</td>
                  <td>{row.rule.secondaryRadiusKm} km</td>
                  <td>{row.rule.tertiaryRadiusKm} km</td>
                  <td>{row.monthlyCapacity} / {row.concurrentCapacity}</td>
                  <td>{row.currentScopeCount}</td>
                  <td>{row.nextBandCount}</td>
                  <td>{row.nextBandManualCandidates}</td>
                  <td><span className={capacityBadge(row.capacityStatus)}>{row.capacityStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Keywords & Hinweise</div>
          <pre className="doc">{JSON.stringify(rows.map((r: any) => ({
            trade: r.rule.trade,
            priority: r.rule.priority,
            positive: r.rule.keywordsPositive,
            negative: r.rule.keywordsNegative,
            regionNotes: r.rule.regionNotes
          })), null, 2)}</pre>
        </div>

        <div className="card">
          <div className="section-title">Interpretation</div>
          <div className="stack">
            <div className="meta">„Im Scope“ = Primär + Sekundär, also aktuell aktiv gespielter Suchraum.</div>
            <div className="meta">„Nächste Klasse“ = Tertiärband oberhalb des aktuellen Suchraums.</div>
            <div className="meta">„Manuell prüfen“ = potenzielle zusätzliche Chancen bei Radiuserweiterung.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
