import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function OpportunitiesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Opportunities</span> & Bearbeitung</h1>
        <p className="sub">Operative Arbeitsliste für Treffer, AI-Empfehlungen und Vertriebsentscheidungen.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Geschäftsfeld</th>
                <th>Stage</th>
                <th>Priorität</th>
                <th>Owner</th>
                <th>AI</th>
                <th>Manuell</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td><Link className="linkish" href={`/opportunities/${row.id}`}>{row.title}</Link></td>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.stage}</td>
                  <td>{row.priority}</td>
                  <td>{row.ownerId || "-"}</td>
                  <td>{row.aiRecommendation || "-"}</td>
                  <td>{row.manualDecision || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
