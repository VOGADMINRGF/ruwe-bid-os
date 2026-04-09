import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, dataModeBadgeClass, dataModeLabel } from "@/lib/format";

export default async function LivePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Live Abruf</h1>
            <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
          </div>
          <p className="sub">TED und service.bund live testen und Treffer direkt in die Arbeitslisten übernehmen.</p>
        </div>
        <form action="/api/ops/live-ingest" method="post">
          <button className="button" type="submit">Live Abruf starten</button>
        </form>
      </div>

      <div className="card">
        <div className="meta">Letzter Abruf: {formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div>
        <div className="meta">Quelle: {db.meta?.lastSuccessfulIngestionSource || "-"}</div>
        <div className="meta">Treffer im Speicher: {hits.length}</div>
      </div>

      <div className="card">
        <Link className="linkish" href="/source-hits">Zu allen Treffern</Link>
      </div>
    </div>
  );
}
