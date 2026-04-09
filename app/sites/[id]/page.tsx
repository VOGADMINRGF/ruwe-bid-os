import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const rules = (db.siteTradeRules || []).filter((x: any) => x.siteId === id);
  const tenders = (db.tenders || []).filter((x: any) => (x.distanceKm ?? 9999) <= site.secondaryRadiusKm);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit Radius, Gewerkeregeln und passenden Ausschreibungen.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Stadt</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Primärradius</div><div className="kpi">{site.primaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Sekundärradius</div><div className="kpi">{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Treffer im Radius</div><div className="kpi">{tenders.length}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Gewerkeregeln</div>
          <pre className="doc">{JSON.stringify(rules, null, 2)}</pre>
        </div>
        <div className="card">
          <div className="section-title">Passende Ausschreibungen</div>
          <pre className="doc">{JSON.stringify(tenders, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
