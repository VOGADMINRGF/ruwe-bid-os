#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Showcase Polish Phase 5"

mkdir -p components/showcase
mkdir -p app/showcase
mkdir -p lib

echo "🧠 gemeinsame Helpers ..."
cat > lib/showcase.ts <<'TS'
export function badgeTone(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  if (mode === "smoke") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export function modeLabel(mode?: string) {
  if (mode === "live") return "Live";
  if (mode === "smoke") return "Smoke";
  return "Demo";
}

export function executiveAssessment(db: any) {
  const hits = db.sourceHits || [];
  const pre = hits.filter((x: any) => x.status === "prefiltered").length;
  const manual = hits.filter((x: any) => x.status === "manual_review").length;
  const observed = hits.filter((x: any) => x.status === "observed").length;

  if (pre >= 5) return {
    tone: "gut",
    title: "Gute operative Lage",
    text: "Mehrere Treffer sind bereits bid-vorausgewählt. Fokus sollte jetzt auf Priorisierung und Angebotsbearbeitung liegen."
  };

  if (manual >= 3 || observed >= 5) return {
    tone: "gemischt",
    title: "Prüflage aktiv",
    text: "Es gibt relevante Treffer, aber ein Teil muss manuell oder regelbasiert weiter geschärft werden."
  };

  return {
    tone: "kritisch",
    title: "Noch kein belastbarer Operativstand",
    text: "Die Datenlage ist aktuell eher Demo-/Smoke-basiert oder es fehlen noch ausreichend verwertbare Treffer."
  };
}

export function emptyStateFor(module: string) {
  const map: Record<string, { title: string; text: string }> = {
    pipeline: {
      title: "Noch keine echte Pipeline",
      text: "Solange keine produktiven Vorgänge vorhanden sind, werden Demo-Chancen oder erste Live-Treffer als Arbeitsbasis genutzt."
    },
    tenders: {
      title: "Noch keine vollständige Ausschreibungsliste",
      text: "Die Treffer kommen aktuell aus Demo-/Smoke-/Live-Mix. Mit echten Connectoren wird hier die operative Hauptliste entstehen."
    },
    agents: {
      title: "Noch keine individuell gepflegten Agentenprofile",
      text: "Bis echte Rollen gepflegt werden, bleiben Demo-Agenten sichtbar, damit die Steuerlogik vorzeigbar bleibt."
    },
    buyers: {
      title: "Noch keine vollständig gepflegten Auftraggeber",
      text: "Öffentliche Auftraggeber werden aktuell nur als Beispiel- und Testbasis geführt."
    },
    references: {
      title: "Noch keine belastbaren Referenzen gepflegt",
      text: "Referenzen werden später für Bid-Entscheidung und Vertriebsargumentation je Gewerk genutzt."
    }
  };
  return map[module] || {
    title: "Noch keine Daten",
    text: "Dieses Modul ist vorbereitet, aber noch nicht produktiv befüllt."
  };
}
TS

echo "🎨 Showcase-Komponenten ..."
cat > components/showcase/ExecutiveSummaryCard.tsx <<'TSX'
import { executiveAssessment } from "@/lib/showcase";

export default function ExecutiveSummaryCard({ db }: { db: any }) {
  const result = executiveAssessment(db);
  const cls =
    result.tone === "gut"
      ? "badge badge-gut"
      : result.tone === "gemischt"
        ? "badge badge-gemischt"
        : "badge badge-kritisch";

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">Executive Summary</div>
        <span className={cls}>{result.title}</span>
      </div>
      <p className="meta" style={{ marginTop: 12 }}>{result.text}</p>
    </div>
  );
}
TSX

cat > components/showcase/EmptyModuleCard.tsx <<'TSX'
import { emptyStateFor } from "@/lib/showcase";

export default function EmptyModuleCard({ module }: { module: string }) {
  const state = emptyStateFor(module);

  return (
    <div className="card">
      <div className="section-title">{state.title}</div>
      <p className="meta" style={{ marginTop: 12 }}>{state.text}</p>
    </div>
  );
}
TSX

echo "🧭 Showcase-Seite ..."
cat > app/showcase/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, dataModeBadgeClass, dataModeLabel } from "@/lib/format";
import ExecutiveSummaryCard from "@/components/showcase/ExecutiveSummaryCard";

export default async function ShowcasePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];
  const pre = hits.filter((x: any) => x.status === "prefiltered").length;
  const review = hits.filter((x: any) => x.status === "manual_review").length;
  const sites = (db.sites || []).filter((x: any) => x.active);
  const rules = (db.siteTradeRules || []).filter((x: any) => x.enabled);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Showcase</h1>
            <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
          </div>
          <p className="sub">Kuratiertes Gesamtbild für Gespräche mit Dritten.</p>
        </div>
        <Link className="button" href="/">Zum Dashboard</Link>
      </div>

      <ExecutiveSummaryCard db={db} />

      <section className="grid grid-4">
        <div className="card">
          <div className="label">Letzter Abruf</div>
          <div className="kpi" style={{ fontSize: 28 }}>{formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div>
        </div>
        <div className="card">
          <div className="label">Treffer gesamt</div>
          <div className="kpi">{hits.length}</div>
        </div>
        <div className="card">
          <div className="label">Bid-Kandidaten</div>
          <div className="kpi">{pre}</div>
        </div>
        <div className="card">
          <div className="label">Manuell prüfen</div>
          <div className="kpi">{review}</div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Operative Basis</div>
          <p className="meta">Aktive Standorte: {sites.length}</p>
          <p className="meta">Aktive Regeln: {rules.length}</p>
          <p className="meta">Quellenmodus: {dataModeLabel(mode)}</p>
        </div>

        <div className="card">
          <div className="section-title">Vorzeigelogik</div>
          <p className="meta">1. Quelle prüfen</p>
          <p className="meta">2. Treffer matchen</p>
          <p className="meta">3. Bid / Prüfen / No-Go ableiten</p>
          <p className="meta">4. Pipeline und Angebotsarbeit steuern</p>
        </div>
      </section>
    </div>
  );
}
TSX

echo "🧭 Navigation um Showcase ergänzen ..."
cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/showcase", "Showcase"],
  ["/sources", "Sources"],
  ["/dashboard/monitoring", "Monitoring"],
  ["/dashboard/source-tests", "Source Tests"],
  ["/sites", "Sites"],
  ["/service-areas", "Service Areas"],
  ["/site-rules", "Site Rules"],
  ["/keywords", "Keywords"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
  ["/buyers", "Buyers"],
  ["/references", "References"],
  ["/config", "Config"]
] as const;

export default function Nav() {
  return (
    <div className="nav">
      {items.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </div>
  );
}
TSX

echo "📄 Module mit sauberem Fallback ..."
cat > app/agents/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function AgentsPage() {
  const db = await readStore();
  const agents = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Rollen, Zuständigkeiten und Demo-/Produktivsteuerung.</p>
      </div>

      {!agents.length ? (
        <EmptyModuleCard module="agents" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fokus</th>
                <th>Level</th>
                <th>Win-Rate</th>
                <th>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a: any) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.focus}</td>
                  <td>{a.level}</td>
                  <td>{Math.round((a.winRate || 0) * 100)}%</td>
                  <td>{Math.round((a.pipelineValue || 0) / 1000)}k €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
TSX

cat > app/pipeline/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function PipelinePage() {
  const db = await readStore();
  const rows = db.pipeline || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Qualifizierung, Angebot, Verhandlung und operative Steuerung.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="pipeline" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Stage</th>
                <th>Wert</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.stage}</td>
                  <td>{Math.round((r.value || 0) / 1000)}k €</td>
                  <td>{r.ownerId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
TSX

cat > app/tenders/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function TendersPage() {
  const db = await readStore();
  const rows = db.tenders || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Tenders</h1>
        <p className="sub">Operative Ausschreibungen mit Entscheidung und Zuständigkeit.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="tenders" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Entscheidung</th>
                <th>Frist</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.region}</td>
                  <td>{r.trade}</td>
                  <td>{r.decision}</td>
                  <td>{r.dueDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
TSX

cat > app/buyers/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function BuyersPage() {
  const db = await readStore();
  const rows = db.buyers || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Buyers</h1>
        <p className="sub">Auftraggeberbild und strategische Relevanz.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="buyers" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Strategisch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.strategic ? "Ja" : "Nein"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
TSX

cat > app/references/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function ReferencesPage() {
  const db = await readStore();
  const rows = db.references || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">References</h1>
        <p className="sub">Referenzen zur späteren Vertriebsargumentation und Eignung.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="references" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Gewerk</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.trade}</td>
                  <td>{r.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
TSX

echo "🧾 Reifegrad-Dokument ..."
cat > docs/PHASE_5_SHOWCASE_READINESS.md <<'DOC'
# PHASE_5_SHOWCASE_READINESS

## Ziel
Das System soll in 5 Phasen nicht nur technisch wachsen, sondern vorzeigbar und erklärbar werden.

## Erreicht
- Dashboard
- Showcase
- Demo/Smoke/Live-Kennzeichnung
- Live-Ingest erster Stand
- Sites / Rules / Hits / Monitoring
- AI- und Smoke-Test
- Mongo-first mit Fallback

## Noch offen
- echte Dedupe-Historie
- Berlin Live Connector
- Rollen- und Rechtemodell
- Audit Log
- Scheduler
- Exporte
- Bulk-Workflows
- UI-Feinschliff bei Detailseiten

## Vorzeigbar für Dritte
Ja, als:
- operativer Prototype
- Entscheidungs- und Steuerungsdemo
- Quellen-/Standort-/Bid-Logik Showcase

Noch nicht final produktionsreif als:
- vollautomatischer Ausschreibungsbetrieb
- revisionssichere Produktionsplattform
DOC

npm run build || true
git add .
git commit -m "feat: add showcase layer, stronger fallback states and phase 5 presentation readiness" || true
git push origin main || true

echo "✅ Showcase Polish Phase 5 eingebaut."
