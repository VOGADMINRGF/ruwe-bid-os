import Link from "next/link";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";

function badgeAssessment(value: string) {
  if (value === "gut") return "badge badge-gut";
  if (value === "kritisch") return "badge badge-kritisch";
  return "badge badge-gemischt";
}

function decisionBadge(decision: string) {
  if (decision === "Go") return "badge badge-go";
  if (decision === "Prüfen") return "badge badge-pruefen";
  return "badge badge-no-go";
}

function priorityBadge(priority: string) {
  if (priority === "A") return "badge badge-a";
  if (priority === "B") return "badge badge-b";
  return "badge badge-c";
}

export default async function DashboardPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const pipeline = db.pipeline || [];
  const agents = db.agents || [];
  const zones = db.zones || [];

  const kpis = {
    newCount: tenders.filter((t: any) => t.status === "neu").length,
    manualCount: manualQueueCount(tenders),
    goCount: tenders.filter((t: any) => t.decision === "Go").length,
    overdueCount: overdueCount(tenders),
    overall: overallAssessment(tenders),
    weighted: weightedPipeline(pipeline),
    goQuotePct: Math.round(goQuote(tenders) * 100)
  };

  const queue = tenders.filter((t: any) => t.manualReview === "zwingend" || t.decision === "Prüfen");

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Zonen-, radius- und gewerkebasiertes Bid Operating System für Ausschreibungen, Pipeline,
          Agenten, Auftraggeber, Referenzen und spätere Automatisierung.
        </p>
      </section>

      <section className="grid grid-6">
        <div className="card"><div className="label">Neu eingegangen</div><div className="kpi">{kpis.newCount}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{kpis.manualCount}</div></div>
        <div className="card"><div className="label">Go-Kandidaten</div><div className="kpi">{kpis.goCount}</div></div>
        <div className="card"><div className="label">Überfällig</div><div className="kpi" style={{ color: "var(--red)" }}>{kpis.overdueCount}</div></div>
        <div className="card"><div className="label">Weighted Pipeline</div><div className="kpi" style={{ color: "var(--orange)" }}>{Math.round(kpis.weighted / 1000)}k €</div></div>
        <div className="card"><div className="label">Gesamtlage</div><div className={badgeAssessment(kpis.overall)}>{kpis.overall}</div><div className="meta" style={{ marginTop: 10 }}>Go-Quote: {kpis.goQuotePct}%</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Management-Warteschlange</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Priorität</th>
                  <th>Review</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{t.region}</td>
                    <td><span className={priorityBadge(t.priority)}>{t.priority}</span></td>
                    <td>{t.manualReview}</td>
                    <td>{t.dueDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Systemlage</div>
          <div className="stack">
            <div className="meta">Tenders im Register: {tenders.length}</div>
            <div className="meta">Pipeline-Einträge: {pipeline.length}</div>
            <div className="meta">Zonen: {zones.length}</div>
            <div className="meta">Agents: {agents.length}</div>
            <div className="meta">Nächster sinnvoller Fokus: Management Queue leeren, Go-Kandidaten priorisieren, No-Go sauber dokumentieren.</div>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Tender Übersicht</div>
          <div className="table-wrap">
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
                {tenders.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{t.region}</td>
                    <td>{t.trade}</td>
                    <td><span className={priorityBadge(t.priority)}>{t.priority}</span></td>
                    <td><span className={decisionBadge(t.decision)}>{t.decision}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Agenten & Steuerung</div>
          <div className="table-wrap">
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
                {agents.map((a: any) => (
                  <tr key={a.id}>
                    <td><Link className="linkish" href={`/agents/${a.id}`}>{a.name}</Link></td>
                    <td>{a.focus}</td>
                    <td>{a.level}</td>
                    <td>{Math.round(a.winRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
