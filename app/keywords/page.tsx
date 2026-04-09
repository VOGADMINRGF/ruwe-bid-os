import { readDb } from "@/lib/db";

export default async function KeywordsPage() {
  const db = await readDb();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Keywords</h1>
        <p className="sub">Positive und negative Suchbegriffe je Gewerk und Standort, optional regional kommentiert.</p>
      </div>
      <div className="grid grid-2">
        {rules.map((r: any) => {
          const site = sites.find((s: any) => s.id === r.siteId);
          return (
            <div className="card" key={r.id}>
              <div className="section-title">{site?.name || "-"} · {r.trade}</div>
              <div className="meta">Region Hinweis: {r.regionNotes || "-"}</div>
              <div className="meta" style={{ marginTop: 8 }}>Positiv: {(r.keywordsPositive || []).join(", ") || "-"}</div>
              <div className="meta">Negativ: {(r.keywordsNegative || []).join(", ") || "-"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
