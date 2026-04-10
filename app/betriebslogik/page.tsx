import { listBetriebslogikCards } from "@/lib/betriebslogik";

export default async function BetriebslogikPage() {
  const rows = await listBetriebslogikCards();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Betriebs</span>logik</h1>
        <p className="sub">Radius, Kapazität, Priorität, Keywords und regionale Hinweise pro Standort und Gewerk in einer gemeinsamen Oberfläche.</p>
      </div>

      <div className="grid grid-2">
        {rows.map((row: any) => (
          <div className="card" key={row.id}>
            <div className="section-title">{row.siteName} · {row.trade}</div>
            <div className="meta" style={{ marginTop: 10 }}>{row.city || "-"}</div>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="label">Priorität</div>
                <div>{row.priority}</div>
              </div>
              <div>
                <div className="label">Aktiv</div>
                <div>{row.enabled ? "Ja" : "Nein"}</div>
              </div>
              <div>
                <div className="label">Kapazität</div>
                <div>{row.monthlyCapacity} / {row.concurrentCapacity}</div>
              </div>
            </div>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="label">Primär</div>
                <div>{row.primaryRadiusKm} km</div>
              </div>
              <div>
                <div className="label">Sekundär</div>
                <div>{row.secondaryRadiusKm} km</div>
              </div>
              <div>
                <div className="label">Tertiär</div>
                <div>{row.tertiaryRadiusKm} km</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="label">Positive Keywords</div>
              <div>{row.keywordsPositive.length ? row.keywordsPositive.join(", ") : "-"}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Negative Keywords</div>
              <div>{row.keywordsNegative.length ? row.keywordsNegative.join(", ") : "-"}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Regionshinweis</div>
              <div>{row.regionNotes || "-"}</div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="label">Generierte Suchabfragen</div>
              <div style={{ marginTop: 8 }}>
                {row.generatedQueries.map((q: string) => (
                  <span key={q} className="badge" style={{ marginRight: 8, marginBottom: 8 }}>{q}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
