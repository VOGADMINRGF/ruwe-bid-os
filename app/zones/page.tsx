import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ZonesPage() {
  const db = await readDb();
  const items = db.zones || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Zones</h1>
        <p className="sub">Zonenlogik mit Radius, Prioritätsgewerken und regionalem Fit.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Primärradius</th>
              <th>Sekundärradius</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.primaryRadiusKm} km</td>
                <td>{item.secondaryRadiusKm} km</td>
                <td><Link className="linkish" href={`/zones/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
