import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, modeBadgeClass, modeLabel } from "@/lib/format";

export default async function LivePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "test";
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Live Abruf</h1>
            <span className={modeBadgeClass(mode)}>Datenstand: {modeLabel(mode)}</span>
          </div>
          <p className="sub">TED und service.bund live auslösen und die Treffer direkt in den Steuerstand übernehmen.</p>
        </div>
        <Link className="button" href="/api/ops/live-ingest?redirect=1">Jetzt abrufen</Link>
      </div>

      <div className="card">
        <div className="meta">Letzter Abruf: {formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div>
        <div className="meta">Quelle: {db.meta?.lastSuccessfulIngestionSource || "-"}</div>
        <div className="meta">Aktuelle Treffer: {hits.length}</div>
      </div>
    </div>
  );
}
