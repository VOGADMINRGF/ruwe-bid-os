import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { resolveBestExternalUrl, hasRealExternalDetailUrl } from "@/lib/linking";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function SourceHitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const hit = (db.sourceHits || []).find((x: any) => x.id === id);

  if (!hit) notFound();

  const externalUrl = resolveBestExternalUrl(hit, db.sourceRegistry || []);
  const hasExternal = hasRealExternalDetailUrl(hit);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Treffer</span> im Detail</h1>
        <p className="sub">Interne Deal-/Prüfmaske mit sicherem Absprung zur Quelle.</p>
      </div>

      <div className="card">
        <div className="section-title">{hit.title}</div>
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="meta">Region: {hit.region || "-"}</div>
          <div className="meta">Geschäftsfeld: {hit.trade || "-"}</div>
          <div className="meta">Quelle: {hit.sourceName || hit.sourceId || "-"}</div>
          <div className="meta">Volumen: {formatCurrencyCompact(hit.estimatedValue)}</div>
          <div className="meta">Laufzeit: {hit.durationMonths ? `${hit.durationMonths} Monate` : "-"}</div>
          <div className="meta">AI: {hit.aiRecommendation || hit.status || "-"}</div>
          <div className="meta">Standortmatch: {hit.matchedSiteId || "-"}</div>
          <div className="meta">PLZ: {hit.postalCode || "-"}</div>
          <div className="meta">Distanz: {hit.distanceKm ?? "-"} km</div>
        </div>

        <div className="toolbar" style={{ marginTop: 20 }}>
          {externalUrl ? (
            <a className="button" href={externalUrl} target="_blank">
              {hasExternal ? "Originalquelle öffnen" : "Quellensuche öffnen"}
            </a>
          ) : null}
          <Link className="button-secondary" href="/source-hits">Zur Trefferliste</Link>
          <Link className="button-secondary" href={`/pipeline?q=${encodeURIComponent(hit.title || "")}`}>In Pipeline suchen</Link>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Rohdaten</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 14 }}>{JSON.stringify(hit, null, 2)}</pre>
      </div>
    </div>
  );
}
