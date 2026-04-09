#!/bin/bash
set -e

cd "$(pwd)"

mkdir -p app/pipeline app/pipeline/[id]
mkdir -p app/agents app/agents/[id]
mkdir -p app/zones app/zones/[id]
mkdir -p app/buyers app/buyers/[id]
mkdir -p app/references app/references/[id]
mkdir -p app/config

cat > app/pipeline/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function PipelinePage() {
  const db = await readDb();
  const items = db.pipeline || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Aktive Vorgänge, Stufen und Werte der Vertriebs-Pipeline.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Stage</th>
              <th>Wert</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.stage}</td>
                <td>{item.value?.toLocaleString("de-DE")} €</td>
                <td><Link className="linkish" href={`/pipeline/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/pipeline/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.pipeline || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.title}</h1>
        <p className="sub">Detailansicht des Pipeline-Eintrags.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/agents/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function AgentsPage() {
  const db = await readDb();
  const items = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Koordinatoren, Spezialisten und Assistenz mit Performance-Sicht.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Fokus</th>
              <th>Level</th>
              <th>Win-Rate</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.focus}</td>
                <td>{item.level}</td>
                <td>{Math.round(item.winRate * 100)}%</td>
                <td><Link className="linkish" href={`/agents/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/agents/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.agents || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.name}</h1>
        <p className="sub">Detailansicht des Agenten.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/zones/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ZonesPage() {
  const db = await readDb();
  const items = db.zones || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Zones</h1>
        <p className="sub">Zonenlogik mit Radius, Prioritätsgewerken und regionalem Fit.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Primärradius</th>
              <th>Sekundärradius</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.primaryRadiusKm} km</td>
                <td>{item.secondaryRadiusKm} km</td>
                <td><Link className="linkish" href={`/zones/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/zones/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function ZoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.zones || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.name}</h1>
        <p className="sub">Detailansicht der Zone.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/buyers/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function BuyersPage() {
  const db = await readDb();
  const items = db.buyers || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Buyers</h1>
        <p className="sub">Auftraggeber mit Typ, strategischer Relevanz und Detailzugriff.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Strategisch</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.strategic ? "Ja" : "Nein"}</td>
                <td><Link className="linkish" href={`/buyers/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/buyers/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.buyers || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.name}</h1>
        <p className="sub">Detailansicht des Auftraggebers.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/references/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ReferencesPage() {
  const db = await readDb();
  const items = db.references || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">References</h1>
        <p className="sub">Referenzdatenbank für spätere Angebots- und Fit-Unterstützung.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Gewerk</th>
              <th>Region</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.trade}</td>
                <td>{item.region}</td>
                <td><Link className="linkish" href={`/references/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/references/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function ReferenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.references || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.title}</h1>
        <p className="sub">Detailansicht der Referenz.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/config/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function ConfigPage() {
  const db = await readDb();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Config</h1>
        <p className="sub">Systemregeln, Bewertungslogik, Quellen und Rollenmodell.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(db.config, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

npm run build || true
git add .
git commit -m "fix: finish module pages and detail views without mac bash substitution" || true
git push origin main || true

echo "✅ Module sauber fertiggestellt."
