import Link from "next/link";

export default async function OpsPage() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Ops</h1>
        <p className="sub">Technische Prüfungen, Smoke-Tests und AI-Checks für den laufenden Betrieb.</p>
      </div>

      <section className="grid grid-3">
        <Link href="/dashboard/smoke" className="card">
          <div className="section-title">Smoke</div>
          <p className="meta" style={{ marginTop: 10 }}>Grundlegende Struktur- und Datenprüfung.</p>
        </Link>

        <Link href="/dashboard/ai-smoke" className="card">
          <div className="section-title">AI Test</div>
          <p className="meta" style={{ marginTop: 10 }}>Heuristische und AI-gestützte Bewertung einzelner Treffer.</p>
        </Link>

        <Link href="/dashboard/source-tests" className="card">
          <div className="section-title">Quellentests</div>
          <p className="meta" style={{ marginTop: 10 }}>Status und technische Erreichbarkeit der Quellen.</p>
        </Link>

        <Link href="/dashboard/audit" className="card">
          <div className="section-title">Audit Log</div>
          <p className="meta" style={{ marginTop: 10 }}>Nachvollziehbarkeit für Overrides, Antworten und Ops-Läufe.</p>
        </Link>

        <a href="/api/ops/scheduler/tick" className="card">
          <div className="section-title">Scheduler Tick</div>
          <p className="meta" style={{ marginTop: 10 }}>Manueller Scheduler-Lauf für den operativen Hauptpfad.</p>
        </a>

        <a href="/api/reporting/management-summary" className="card">
          <div className="section-title">Reporting JSON</div>
          <p className="meta" style={{ marginTop: 10 }}>Management-Summary für Export/Weiterverarbeitung.</p>
        </a>

        <a href="/api/reporting/opportunities.csv" className="card">
          <div className="section-title">Export CSV</div>
          <p className="meta" style={{ marginTop: 10 }}>Opportunities als CSV exportieren.</p>
        </a>
      </section>
    </div>
  );
}
