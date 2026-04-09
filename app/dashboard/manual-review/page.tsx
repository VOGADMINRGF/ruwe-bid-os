import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ManualReviewPage() {
  const db = await readDb();
  const items = (db.tenders || []).filter((t: any) => t.manualReview === "zwingend" || t.decision === "Prüfen");
  return (
    <div className="stack">
      <div><h1 className="h1">Manuell prüfen</h1><p className="sub">Review-pflichtige und offene Entscheidungsfälle.</p></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Titel</th><th>Standort</th><th>Gewerk</th><th>Frist</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.matchedSiteId}</td>
                <td>{t.trade}</td>
                <td>{t.dueDate}</td>
                <td>{t.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
