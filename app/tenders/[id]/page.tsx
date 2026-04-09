import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { fitScore } from "@/lib/scoring";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  const zone = (db.zones || []).find((x: any) => x.id === tender.zoneId);
  const buyer = (db.buyers || []).find((x: any) => x.id === tender.buyerId);
  const owner = (db.agents || []).find((x: any) => x.id === tender.ownerId);
  const score = fitScore(tender, zone, buyer);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{tender.title}</h1>
        <p className="sub">Detailansicht mit Fit, Verantwortlichkeit, Buyer, Zone und Entscheidungsstand.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Region</div><div className="kpi">{tender.region}</div></div>
        <div className="card"><div className="label">Gewerk</div><div className="kpi">{tender.trade}</div></div>
        <div className="card"><div className="label">Fit Score</div><div className="kpi">{score}</div></div>
        <div className="card"><div className="label">Entscheidung</div><div className="kpi">{tender.decision}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Einordnung</div>
          <div className="stack">
            <div className="meta">Priorität: {tender.priority}</div>
            <div className="meta">Manual Review: {tender.manualReview}</div>
            <div className="meta">Risiko: {tender.riskLevel}</div>
            <div className="meta">Fit Summary: {tender.fitSummary}</div>
            <div className="meta">Wert: {tender.estimatedValue.toLocaleString("de-DE")} €</div>
            <div className="meta">Frist: {tender.dueDate || "-"}</div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Bezüge</div>
          <div className="stack">
            <div className="meta">Zone: {zone?.name || "-"}</div>
            <div className="meta">Buyer: {buyer?.name || "-"}</div>
            <div className="meta">Owner: {owner?.name || "-"}</div>
            <div className="meta">Quelle: {tender.sourceType || "-"}</div>
            <div className="meta">Notiz: {tender.notes || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
