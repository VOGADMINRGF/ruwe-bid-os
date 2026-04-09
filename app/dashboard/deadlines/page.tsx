import { readStore } from "@/lib/storage";
import { deadlineView } from "@/lib/forecastLogic";

export default async function DeadlinesPage() {
  const db = await readStore();
  const tenders = deadlineView(db.tenders || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Fristen</h1>
        <p className="sub">Zeitkritische Chancen und der unmittelbare Bearbeitungsdruck.</p>
      </div>

      <section className="grid grid-3">
        <div className="card">
          <div className="label">Innerhalb 7 Tage</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft >= 0 && x.daysLeft <= 7).length}</div>
        </div>
        <div className="card">
          <div className="label">Innerhalb 14 Tage</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft >= 8 && x.daysLeft <= 14).length}</div>
        </div>
        <div className="card">
          <div className="label">Überfällig</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft < 0).length}</div>
        </div>
      </section>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Entscheidung</th>
              <th>Frist</th>
              <th>Tage</th>
              <th>Status</th>
              <th>Nächster Schritt</th>
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
                <td>{row.nextStep || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
