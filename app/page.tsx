import Link from "next/link";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";
import { prefilteredCount, siteCoverage } from "@/lib/siteLogic";

function pill(text: string, kind: "good" | "warn" | "bad" = "good") {
  const cls = kind === "good" ? "badge badge-gut" : kind === "bad" ? "badge badge-kritisch" : "badge badge-gemischt";
  return <span className={cls}>{text}</span>;
}

export default async function DashboardPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const meta = db.meta || {};
  const pipeline = db.pipeline || [];

  const total = tenders.length;
  const prefiltered = prefilteredCount(tenders);
  const go = tenders.filter((t: any) => t.decision === "Go").length;
  const noGo = tenders.filter((t: any) => t.decision === "No-Go").length;
  const manual = manualQueueCount(tenders);
  const activeSites = sites.filter((s: any) => s.active).length;
  const activeRules = rules.filter((r: any) => r.enabled).length;
  const coverage = siteCoverage(sites, rules, tenders);
  const overall = overallAssessment(tenders);

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          RUWE-Standorte, Gewerke, Radius, Keywords und aktueller Ausschreibungsabruf in einer operativen Steueransicht.
        </p>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div className="label">Monitoring</div>
            <div className="meta">Letzter Abruf: {meta.lastSuccessfulIngestionAt || "-"}</div>
            <div className="meta">Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
          </div>
          <div className="row">
            {pill(`${meta.newSinceLastRun || 0} neu`, "good")}
            {pill(`${meta.duplicateCountLastRun || 0} Dubletten`, "warn")}
            {pill(`${meta.ingestionErrorsLastRun || 0} Fehler`, meta.ingestionErrorsLastRun ? "bad" : "good")}
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <div className="card"><div className="label">Gesamt</div><div className="kpi">{total}</div></div>
        <div className="card"><div className="label">Bid vorausgewählt</div><div className="kpi">{prefiltered}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{manual}</div></div>
        <div className="card"><div className="label">Go / No-Go</div><div className="kpi">{go} / {noGo}</div></div>
        <div className="card"><div className="label">Standorte / Regeln</div><div className="kpi">{activeSites} / {activeRules}</div></div>
        <div className="card"><div className="label">Weighted Pipeline</div><div className="kpi" style={{ color: "var(--orange)" }}>{Math.round(weightedPipeline(pipeline) / 1000)}k €</div><div className="meta">Go-Quote: {Math.round(goQuote(tenders) * 100)}%</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Standorte & Gewerke</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Standort</th>
                  <th>Radius</th>
                  <th>Gewerke</th>
                  <th>Treffer</th>
                  <th>Go</th>
                  <th>Prüfen</th>
                  <th>No-Go</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row: any) => (
                  <tr key={row.site.id}>
                    <td><Link className="linkish" href={`/sites/${row.site.id}`}>{row.site.name}</Link></td>
                    <td>{row.site.primaryRadiusKm}/{row.site.secondaryRadiusKm} km</td>
                    <td>{row.rules.map((r: any) => r.trade).join(", ")}</td>
                    <td>{row.tendersTotal}</td>
                    <td>{row.goCount}</td>
                    <td>{row.reviewCount}</td>
                    <td>{row.noGoCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Systemstatus</div>
          <div className="stack">
            <div className="meta">Gesamtlage: {pill(overall, overall === "gut" ? "good" : overall === "kritisch" ? "bad" : "warn")}</div>
            <div className="meta">Überfällige Fälle: {overdueCount(tenders)}</div>
            <div className="meta">Nächster Fokus: Regeln pflegen, Keywords schärfen, Prüffälle reduzieren.</div>
            <div className="row">
              <Link className="linkish" href="/sites">Sites</Link>
              <Link className="linkish" href="/site-rules">Site Rules</Link>
              <Link className="linkish" href="/keywords">Keywords</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
