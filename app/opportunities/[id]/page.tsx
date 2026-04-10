import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import OpportunityEditor from "@/components/forms/OpportunityEditor";
import OpportunityLearningForm from "@/components/forms/OpportunityLearningForm";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const opportunity = (db.opportunities || []).find((x: any) => x.id === id);

  if (!opportunity) notFound();

  const sourceHit = (db.sourceHits || []).find((x: any) => x.id === opportunity.sourceHitId) || null;
  const agents = Array.isArray(db.agents) && db.agents.length
    ? db.agents
    : [
        { id: "agent_nordost", name: "Agent Nord/Ost" },
        { id: "agent_berlin_mitte", name: "Agent Berlin Mitte" },
        { id: "agent_sachsen", name: "Agent Sachsen" },
        { id: "agent_sicherheit", name: "Agent Sicherheit" },
        { id: "assistenz_a", name: "Assistenz A" },
        { id: "assistenz_b", name: "Assistenz B" }
      ];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Opportunity</span> im Detail</h1>
        <p className="sub">Manuelle Steuerung von Stage, Owner, Override, Frist und nächstem Schritt.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">{opportunity.title}</div>
          <div className="stack" style={{ marginTop: 16 }}>
            <div className="meta">Region: {opportunity.region || "-"}</div>
            <div className="meta">Geschäftsfeld: {opportunity.trade || "-"}</div>
            <div className="meta">Volumen: {formatCurrencyCompact(opportunity.estimatedValue)}</div>
            <div className="meta">Laufzeit: {opportunity.durationMonths || "-"} Monate</div>
            <div className="meta">AI-Empfehlung: {opportunity.aiRecommendation || "-"}</div>
            <div className="meta">AI-Begründung: {opportunity.aiReason || "-"}</div>
            <div className="meta">AI-Confidence: {opportunity.aiConfidence ?? "-"}</div>
            <div className="meta">Direktlink valide: {opportunity.directLinkValid ? "ja" : "nein"}</div>
            <div className="meta">Operativ nutzbar: {opportunity.operationallyUsable ? "ja" : "nein"}</div>
            <div className="meta">Fehlende Parameter: {(!opportunity.estimatedValue || opportunity.estimatedValue <= 0) ? "Volumen-/Kostenlogik prüfen" : "-"}</div>
          </div>

          <div className="toolbar" style={{ marginTop: 20 }}>
            {opportunity.externalResolvedUrl ? (
              <a className="button" href={opportunity.externalResolvedUrl} target="_blank">Quelle öffnen</a>
            ) : null}
            {sourceHit ? (
              <Link className="button-secondary" href={`/source-hits/${sourceHit.id}`}>Zum Treffer</Link>
            ) : null}
            <Link className="button-secondary" href="/opportunities">Zur Liste</Link>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Bearbeitung</div>
          <div style={{ marginTop: 16 }}>
            <OpportunityEditor opportunity={opportunity} agents={agents} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Lernfeedback & Parameter</div>
        <div className="meta" style={{ marginTop: 10, marginBottom: 14 }}>
          Bestätigte Werte aus realer Bearbeitung können als regionale Lernbasis für künftige Ausschreibungen gespeichert werden.
        </div>
        <OpportunityLearningForm opportunity={opportunity} />
      </div>
    </div>
  );
}
