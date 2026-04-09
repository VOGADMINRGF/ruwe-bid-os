import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const rules = (db.siteTradeRules || []).filter((x: any) => x.siteId === id);
  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const tenders = (db.tenders || []).filter((x: any) => x.matchedSiteId === id);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit Service Areas, Gewerkeregeln und zugeordneten Ausschreibungen.</p>
      </div>
      <div className="grid grid-3">
        <div className="card"><div className="label">Standort</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Primär / Sekundär</div><div className="kpi">{site.primaryRadiusKm}/{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Treffer</div><div className="kpi">{tenders.length}</div></div>
      </div>
      <div className="grid grid-3">
        <div className="card"><div className="section-title">Service Areas</div><pre className="doc">{JSON.stringify(serviceAreas, null, 2)}</pre></div>
        <div className="card"><div className="section-title">Site Rules</div><pre className="doc">{JSON.stringify(rules, null, 2)}</pre></div>
        <div className="card"><div className="section-title">Tenders</div><pre className="doc">{JSON.stringify(tenders, null, 2)}</pre></div>
      </div>
    </div>
  );
}
