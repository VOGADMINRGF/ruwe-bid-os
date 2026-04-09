import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function NewHitsPage() {
  const db = await readStore();
  const hits = (db.sourceHits || []).filter((x: any) => x.addedSinceLastFetch);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Neue Treffer seit letztem Abruf</h1>
        <p className="sub">Hier werden die aktuell neu gefundenen Ausschreibungen geöffnet und bewertet.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Quelle</th>
              <th>Region</th>
              <th>Gewerk</th>
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
                <td>{x.region}</td>
                <td>{x.trade}</td>
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
