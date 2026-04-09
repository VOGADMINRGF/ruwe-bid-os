import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function PrefilteredPage() {
  const db = await readDb();
  const items = (db.tenders || []).filter((t: any) => t.prefilteredForBid);
  return (
    <div className="stack">
      <div><h1 className="h1">Bid vorausgewählt</h1><p className="sub">Alle Tenders innerhalb aktiver Regeln.</p></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Titel</th><th>Standort</th><th>Gewerk</th><th>Distanz</th><th>Entscheidung</th></tr></thead>
          <tbody>
            {items.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.matchedSiteId}</td>
                <td>{t.trade}</td>
                <td>{t.distanceKm} km</td>
                <td>{t.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
