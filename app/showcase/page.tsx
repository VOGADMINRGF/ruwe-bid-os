import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, dataModeBadgeClass, dataModeLabel } from "@/lib/format";
import ExecutiveSummaryCard from "@/components/showcase/ExecutiveSummaryCard";

export default async function ShowcasePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];
  const pre = hits.filter((x: any) => x.status === "prefiltered").length;
  const review = hits.filter((x: any) => x.status === "manual_review").length;
  const sites = (db.sites || []).filter((x: any) => x.active);
  const rules = (db.siteTradeRules || []).filter((x: any) => x.enabled);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Showcase</h1>
            <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
          </div>
          <p className="sub">Kuratiertes Gesamtbild für Gespräche mit Dritten.</p>
        </div>
        <Link className="button" href="/">Zum Dashboard</Link>
      </div>

      <ExecutiveSummaryCard db={db} />

      <section className="grid grid-4">
        <div className="card">
          <div className="label">Letzter Abruf</div>
          <div className="kpi" style={{ fontSize: 28 }}>{formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div>
        </div>
        <div className="card">
          <div className="label">Treffer gesamt</div>
          <div className="kpi">{hits.length}</div>
        </div>
        <div className="card">
          <div className="label">Bid-Kandidaten</div>
          <div className="kpi">{pre}</div>
        </div>
        <div className="card">
          <div className="label">Manuell prüfen</div>
          <div className="kpi">{review}</div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Operative Basis</div>
          <p className="meta">Aktive Standorte: {sites.length}</p>
          <p className="meta">Aktive Regeln: {rules.length}</p>
          <p className="meta">Quellenmodus: {dataModeLabel(mode)}</p>
        </div>

        <div className="card">
          <div className="section-title">Vorzeigelogik</div>
          <p className="meta">1. Quelle prüfen</p>
          <p className="meta">2. Treffer matchen</p>
          <p className="meta">3. Bid / Prüfen / No-Go ableiten</p>
          <p className="meta">4. Pipeline und Angebotsarbeit steuern</p>
        </div>
      </section>
    </div>
  );
}
