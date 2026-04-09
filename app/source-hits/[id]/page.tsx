import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function SourceHitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const hit = (db.sourceHits || []).find((x: any) => x.id === id);

  if (!hit) notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Treffer</span> im Detail</h1>
        <p className="sub">Interne Opportunity-/Dealmaske mit Validität, Schätzung und AI-Entscheidung.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">{hit.title}</div>
          <div className="stack" style={{ marginTop: 16 }}>
            <div className="meta">Region: {hit.region || "-"}</div>
            <div className="meta">Geschäftsfeld: {hit.trade || "-"}</div>
            <div className="meta">Quelle: {hit.sourceName || hit.sourceId || "-"}</div>
            <div className="meta">Volumen: {formatCurrencyCompact(hit.estimatedValue)}</div>
            <div className="meta">Volumenstatus: {hit.estimationStatus || (hit.estimatedValue ? "vorhanden" : "unbekannt")}</div>
            <div className="meta">Schätzhinweis: {hit.estimationNote || "-"}</div>
            <div className="meta">Laufzeit: {hit.durationMonths ? `${hit.durationMonths} Monate` : "-"}</div>
            <div className="meta">AI: {hit.aiRecommendation || hit.status || "-"}</div>
            <div className="meta">AI-Begründung: {hit.aiReason || "-"}</div>
            <div className="meta">AI Provider: {hit.aiProvider || "-"}</div>
            <div className="meta">Primärprovider: {hit.aiPrimaryProvider || "-"}</div>
            <div className="meta">Zweitprovider: {hit.aiSecondaryProvider || "-"}</div>
            <div className="meta">Confidence: {hit.aiConfidence ?? "-"}</div>
            <div className="meta">Standortmatch: {hit.matchedSiteId || "-"}</div>
            <div className="meta">Distanz: {hit.distanceKm ?? "-"} km</div>
            <div className="meta">Linkstatus: {hit.linkStatus || "-"}</div>
            <div className="meta">Quellenqualität: {hit.sourceQuality || "-"}</div>
            <div className="meta">AI zulässig: {hit.aiEligible ? "ja" : "nein"}</div>
            <div className="meta">AI-Blockgrund: {hit.aiBlockedReason || "-"}</div>
          </div>

          <div className="toolbar" style={{ marginTop: 20 }}>
            {hit.externalResolvedUrl ? (
              <a className="button" href={hit.externalResolvedUrl} target="_blank">{hit.linkLabel || "Quelle öffnen"}</a>
            ) : (
              <span className="button-secondary" style={{ pointerEvents: "none", opacity: 0.65 }}>Kein valider Direktlink</span>
            )}
            <form action={`/api/source-hits/${hit.id}/estimate`} method="POST">
              <button className="button-secondary" type="submit">Volumen neu schätzen</button>
            </form>
            <form action={`/api/source-hits/${hit.id}/promote`} method="POST"><button className="button-secondary" type="submit">Als Opportunity anlegen</button></form>
            <Link className="button-secondary" href="/cost-models">Kostenmodelle</Link>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Qualitäts- und Lückenprofil</div>
          <div className="stack" style={{ marginTop: 16 }}>
            <div className="meta">Direktlink belastbar: {hit.linkStatus === "direct_notice" ? "ja" : "nein"}</div>
            <div className="meta">Geschäftsfeld belastbar: {hit.trade && hit.trade !== "Sonstiges" ? "ja" : "nein"}</div>
            <div className="meta">Volumen belastbar: {hit.estimatedValue > 0 ? "ja" : "nein"}</div>
            <div className="meta">Standort fit: {hit.matchedSiteId ? "ja" : "nein"}</div>
            <div className="meta">Offene Lücken: {(hit.sourceQualityReasons || []).join(", ") || "-"}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Rohdaten</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 14 }}>{JSON.stringify(hit, null, 2)}</pre>
      </div>
    </div>
  );
}
