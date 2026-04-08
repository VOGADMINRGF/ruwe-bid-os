import { agents, tenders, zones } from "@/data/seed";
import { goQuote, weightedPipeline, dashboardKPIs, overallAssessment } from "@/lib/score";

export default function Page() {
  const weighted = weightedPipeline(tenders);
  const quote = goQuote(tenders);
  const kpis = dashboardKPIs(tenders);
  const assessment = overallAssessment(tenders);

  const assessmentColor =
    assessment === "gut" ? "#16a34a" : assessment === "kritisch" ? "#dc2626" : "#f59e0b";

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 42, margin: 0 }}>Vertriebssteuerung neu denken.</h1>
        <p style={{ maxWidth: 820, fontSize: 18 }}>
          Zonen-, radius- und gewerkebasiertes Bid Operating System für Pipeline, Agenten,
          Ausschreibungen, Forecast und Automatisierung.
        </p>
      </section>

      {/* KPI CARDS */}
      <section className="grid grid-4">
        <div className="card"><div className="label">Neu eingegangen</div><div className="kpi">{kpis.neu}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{kpis.manual}</div></div>
        <div className="card"><div className="label">Go-Kandidaten</div><div className="kpi">{kpis.goCandidates}</div></div>
        <div className="card"><div className="label">Offene Entscheidungen</div><div className="kpi">{kpis.offene}</div></div>
        <div className="card"><div className="label">Überfällig</div><div className="kpi">{kpis.ueberfaellig}</div></div>
        <div className="card">
          <div className="label">Gesamtlage</div>
          <div className="kpi" style={{ color: assessmentColor, textTransform: "uppercase" }}>
            {assessment}
          </div>
        </div>
      </section>

      {/* MANAGEMENT QUEUE */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Management-Warteschlange</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>Priorität</th>
              <th>Manuelle Prüfung</th>
              <th>Verantwortlich</th>
              <th>Frist</th>
            </tr>
          </thead>
          <tbody>
            {tenders
              .filter((t) => t.manualReview !== "nein" || t.decision === "Prüfen")
              .map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.region}</td>
                  <td>{t.priority}</td>
                  <td>{t.manualReview}</td>
                  <td>{t.owner || "-"}</td>
                  <td>{t.dueDate || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* EXISTING TABLES */}
      <section className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Tender Übersicht</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Entscheidung</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.region}</td>
                  <td>{t.trade}</td>
                  <td>{t.priority}</td>
                  <td>{t.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Agenten & Steuerung</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fokus</th>
                <th>Level</th>
                <th>Win-Rate</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.focus}</td>
                  <td>{a.level}</td>
                  <td>{Math.round(a.winRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <div className="label">Weighted Pipeline</div>
            <div className="kpi">{Math.round(weighted / 1000)}k €</div>
            <div className="label" style={{ marginTop: 8 }}>Go-Quote</div>
            <div className="kpi">{Math.round(quote * 100)}%</div>
          </div>
        </div>
      </section>
    </div>
  );
}
