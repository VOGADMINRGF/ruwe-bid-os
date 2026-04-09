import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function SourceHitsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const db = await readStore();

  let hits = db.sourceHits || [];
  if (params.status) hits = hits.filter((x: any) => x.status === params.status);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Source Hits</h1>
        <p className="sub">Alle gefundenen Ausschreibungen mit Direktsprung zur Quelle.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Quelle</th>
              <th>Standortmatch</th>
              <th>Region</th>
              <th>PLZ</th>
              <th>Gewerk</th>
              <th>Distanz</th>
              <th>Volumen</th>
              <th>Laufzeit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((x: any) => (
              <tr key={x.id}>
                <td><Link className="linkish" href={x.url} target="_blank">{x.title}</Link></td>
                <td>{x.sourceId}</td>
                <td>{x.matchedSiteId}</td>
                <td>{x.region}</td>
                <td>{x.postalCode}</td>
                <td>{x.trade}</td>
                <td>{x.distanceKm} km</td>
                <td>{Math.round((x.estimatedValue || 0) / 1000)}k €</td>
                <td>{x.durationMonths} Mon.</td>
                <td>{x.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
