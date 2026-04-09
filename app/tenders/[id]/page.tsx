import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { fitScore } from "@/lib/scoring";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  const buyer = (db.buyers || []).find((x: any) => x.id === tender.buyerId);
  const zone = (db.zones || []).find((x: any) => x.id === tender.zoneId);
  const score = fitScore(tender, zone, buyer);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="h1">{tender.title}</h1>
          <p className="sub">Tender-Detail mit aktuellem Entscheidungsstand.</p>
        </div>
        <Link className="button" href={`/tenders/${tender.id}/edit`}>Bearbeiten</Link>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Gewerk</div><div className="kpi">{tender.trade}</div></div>
        <div className="card"><div className="label">Entscheidung</div><div className="kpi">{tender.decision}</div></div>
        <div className="card"><div className="label">Distanz</div><div className="kpi">{tender.distanceKm} km</div></div>
        <div className="card"><div className="label">Fit Score</div><div className="kpi">{score}</div></div>
      </div>

      <div className="card">
        <pre className="doc">{JSON.stringify(tender, null, 2)}</pre>
      </div>
    </div>
  );
}
