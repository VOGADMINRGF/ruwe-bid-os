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
