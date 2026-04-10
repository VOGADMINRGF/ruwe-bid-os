#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Crash Fix + Ausschreibungsverständnis Slice"

mkdir -p lib
mkdir -p app/api/opportunities/rebuild
mkdir -p app/api/missing-variables
mkdir -p app/api/parameter-memory
mkdir -p app/opportunities
mkdir -p app/missing-variables
mkdir -p app/parameter-memory

echo "🧠 Helper: safe links + plain serialization ..."
cat > lib/serializers.ts <<'TS'
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function safeHref(value: any, fallback = "/source-hits"): string {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}
TS

echo "🧠 Opportunity schema ..."
cat > lib/opportunitySchema.ts <<'TS'
import { toPlain } from "@/lib/serializers";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function normalizeTrade(hit: any): string {
  const raw = String(hit?.trade || "").trim();
  if (raw) return raw;
  const t = String(hit?.title || "").toLowerCase();
  if (t.includes("glas")) return "Glasreinigung";
  if (t.includes("winter")) return "Winterdienst";
  if (t.includes("hausmeister") || t.includes("hauswart")) return "Hausmeister";
  if (t.includes("sicherheit") || t.includes("objektschutz") || t.includes("wach")) return "Sicherheit";
  if (t.includes("grün") || t.includes("garten") || t.includes("landschaft")) return "Grünpflege";
  if (t.includes("reinigung")) return "Reinigung";
  return "Sonstiges";
}

function normalizeRegion(hit: any): string {
  const txt = `${hit?.region || ""} ${hit?.city || ""} ${hit?.title || ""}`.toLowerCase();
  if (txt.includes("berlin")) return "Berlin";
  if (txt.includes("magdeburg")) return "Magdeburg";
  if (txt.includes("schkeuditz") || txt.includes("leipzig")) return "Schkeuditz / Leipzig";
  if (txt.includes("zeitz")) return "Zeitz";
  if (txt.includes("potsdam") || txt.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (txt.includes("brandenburg")) return "Brandenburg";
  if (txt.includes("online")) return "Online";
  return String(hit?.region || hit?.city || "Sonstige");
}

function detectUnitSignals(text: string) {
  const s = text.toLowerCase();
  return {
    hasHours: /\b(stunden|std\.?|hours?)\b/.test(s),
    hasDays: /\b(tage|werktage|days?)\b/.test(s),
    hasMonths: /\b(monate|monat|months?)\b/.test(s),
    hasYears: /\b(jahre|jahr|years?)\b/.test(s),
    hasArea: /\b(m²|qm|quadratmeter)\b/.test(s),
    hasObjects: /\b(objekte|standorte|liegenschaften|gebäude)\b/.test(s),
    hasFrequency: /\b(täglich|wöchentlich|monatlich|turnus|intervall|pro woche|pro monat)\b/.test(s),
    hasLoses: /\b(los|lose)\b/.test(s),
    hasReadiness: /\b(rufbereitschaft|bereitschaft)\b/.test(s),
    hasWinter: /\b(schnee|glätte|winterdienst)\b/.test(s)
  };
}

function inferCalcMode(signals: ReturnType<typeof detectUnitSignals>) {
  if (signals.hasHours) return "stundenmodell";
  if (signals.hasArea) return "flächenmodell";
  if (signals.hasObjects && signals.hasFrequency) return "turnusmodell";
  return "unklar";
}

function estimateUnderstanding(hit: any) {
  const text = `${hit?.title || ""} ${hit?.aiSummary || ""} ${hit?.aiReason || ""} ${hit?.aiPrimaryReason || ""} ${hit?.url || ""}`;
  const signals = detectUnitSignals(text);
  return {
    signals,
    calcMode: inferCalcMode(signals),
    hoursDerivable: signals.hasHours || (signals.hasObjects && signals.hasFrequency),
    daysDerivable: signals.hasDays,
    areaDerivable: signals.hasArea,
    complexity: signals.hasReadiness || signals.hasWinter ? "hoch" : signals.hasObjects ? "mittel" : "normal"
  };
}

export function buildOpportunityFromHit(hit: any) {
  const understanding = estimateUnderstanding(hit);
  const trade = normalizeTrade(hit);
  const region = normalizeRegion(hit);

  return toPlain({
    id: `opp_${hit.id || Math.random().toString(36).slice(2, 10)}`,
    sourceHitId: String(hit.id || ""),
    title: String(hit.title || ""),
    sourceId: String(hit.sourceId || ""),
    region,
    trade,
    dueDate: hit.dueDate || null,
    durationMonths: n(hit.durationMonths),
    estimatedValue: n(hit.estimatedValue),
    directLinkValid: hit.directLinkValid === true,
    externalResolvedUrl: typeof hit.externalResolvedUrl === "string" ? hit.externalResolvedUrl : null,
    decision: String(hit.aiRecommendation || hit.aiDecision || "Unklar"),
    calcMode: understanding.calcMode,
    complexity: understanding.complexity,
    hoursDerivable: understanding.hoursDerivable,
    daysDerivable: understanding.daysDerivable,
    areaDerivable: understanding.areaDerivable,
    extractedSpecs: toPlain(hit.extractedSpecs || {}),
    understandingSignals: toPlain(understanding.signals),
    missingVariableCount: 0,
    ownerId: null,
    supportOwnerId: null,
    stage: "neu",
    nextQuestion: null,
    operationallyUsable: hit.operationallyUsable !== false
  });
}
TS

echo "🧠 Missing variables engine ..."
cat > lib/missingVariables.ts <<'TS'
import { toPlain } from "@/lib/serializers";

export function deriveMissingVariables(opportunity: any, parameterMemory: any[] = []) {
  const out: any[] = [];

  const hasRegionalRate = parameterMemory.some((p: any) =>
    p?.type === "regional_rate" &&
    p?.region === opportunity.region &&
    p?.trade === opportunity.trade &&
    p?.status === "defined"
  );

  if (opportunity.estimatedValue <= 0) {
    if (opportunity.calcMode === "stundenmodell" && !hasRegionalRate) {
      out.push({
        id: `mv_${opportunity.id}_regional_rate`,
        opportunityId: opportunity.id,
        type: "regional_rate",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Standard-Stundensatz gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      });
    }

    if (opportunity.calcMode === "flächenmodell") {
      out.push({
        id: `mv_${opportunity.id}_area_productivity`,
        opportunityId: opportunity.id,
        type: "area_productivity",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Minuten- oder Produktivitätsrichtwert gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      });
    }

    if (opportunity.calcMode === "unklar") {
      out.push({
        id: `mv_${opportunity.id}_calc_mode`,
        opportunityId: opportunity.id,
        type: "calc_mode",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Wie soll diese Ausschreibung kalkulatorisch eingeordnet werden: Stunden, Fläche, Pauschale oder Mischmodell?`,
        suggestedDefault: "prüfen",
        status: "offen"
      });
    }
  }

  if (!opportunity.directLinkValid) {
    out.push({
      id: `mv_${opportunity.id}_direct_link`,
      opportunityId: opportunity.id,
      type: "direct_link",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Es fehlt ein belastbarer Direktlink. Soll die Quelle manuell validiert werden?`,
      suggestedDefault: "ja",
      status: "offen"
    });
  }

  if (!opportunity.dueDate) {
    out.push({
      id: `mv_${opportunity.id}_due_date`,
      opportunityId: opportunity.id,
      type: "due_date",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Frist unklar. Bitte Fristdatum oder Angebotsfenster prüfen.`,
      suggestedDefault: null,
      status: "offen"
    });
  }

  return toPlain(out);
}
TS

echo "🧠 Parameter memory ..."
cat > lib/parameterMemory.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listParameterMemory() {
  const db = await readStore();
  return toPlain(Array.isArray(db.parameterMemory) ? db.parameterMemory : []);
}

export async function upsertParameterMemory(entry: any) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const idx = rows.findIndex((x: any) =>
    x.type === entry.type &&
    x.trade === entry.trade &&
    x.region === entry.region
  );

  const next = [...rows];
  if (idx >= 0) next[idx] = { ...next[idx], ...entry };
  else next.push(entry);

  await replaceCollection("parameterMemory", next);
  return toPlain(entry);
}
TS

echo "🧠 Assignment engine ..."
cat > lib/assignmentEngine.ts <<'TS'
import { toPlain } from "@/lib/serializers";

const COORDINATORS = [
  { id: "coord_berlin", name: "Koordinator Berlin", regions: ["Berlin"], trades: ["Reinigung", "Glasreinigung", "Hausmeister"] },
  { id: "coord_brandenburg", name: "Koordinator Brandenburg", regions: ["Brandenburg", "Potsdam / Stahnsdorf"], trades: ["Grünpflege", "Reinigung"] },
  { id: "coord_magdeburg", name: "Koordinator Magdeburg", regions: ["Magdeburg"], trades: ["Sicherheit", "Reinigung"] },
  { id: "coord_sachsen", name: "Koordinator Sachsen", regions: ["Schkeuditz / Leipzig", "Zeitz"], trades: ["Winterdienst", "Reinigung", "Hausmeister"] }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

export function assignOpportunity(opportunity: any) {
  const coordinator =
    COORDINATORS.find((x) => x.regions.includes(opportunity.region) && x.trades.includes(opportunity.trade)) ||
    COORDINATORS.find((x) => x.regions.includes(opportunity.region)) ||
    COORDINATORS[0];

  const support = opportunity.estimatedValue > 0 ? ASSISTS[1] : ASSISTS[0];

  return toPlain({
    ownerId: coordinator.id,
    ownerName: coordinator.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
TS

echo "🧠 Opportunity rebuild ..."
cat > lib/opportunityRebuild.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { buildOpportunityFromHit } from "@/lib/opportunitySchema";
import { deriveMissingVariables } from "@/lib/missingVariables";
import { assignOpportunity } from "@/lib/assignmentEngine";
import { toPlain } from "@/lib/serializers";

export async function rebuildOpportunities() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const opportunities = [];
  const missingVariables = [];

  for (const hit of hits) {
    const opp = buildOpportunityFromHit(hit);
    const assignment = assignOpportunity(opp);
    const vars = deriveMissingVariables(opp, parameterMemory);

    opportunities.push({
      ...opp,
      ownerId: assignment.ownerId,
      supportOwnerId: assignment.supportOwnerId,
      missingVariableCount: vars.length,
      nextQuestion: vars[0]?.question || null,
      stage:
        opp.decision === "Bid" ? "qualifiziert" :
        vars.length > 0 ? "review" :
        "beobachten"
    });

    for (const v of vars) {
      missingVariables.push({
        ...v,
        ownerId: assignment.ownerId,
        supportOwnerId: assignment.supportOwnerId
      });
    }
  }

  await replaceCollection("opportunities", toPlain(opportunities));
  await replaceCollection("costGaps", toPlain(missingVariables));

  return toPlain({
    opportunities: opportunities.length,
    missingVariables: missingVariables.length
  });
}
TS

echo "🧩 APIs ..."
cat > app/api/opportunities/rebuild/route.ts <<'TS'
import { NextResponse } from "next/server";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function GET() {
  return NextResponse.json(await rebuildOpportunities());
}
TS

cat > app/api/missing-variables/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(Array.isArray(db.costGaps) ? db.costGaps : []);
}
TS

cat > app/api/parameter-memory/route.ts <<'TS'
import { NextResponse } from "next/server";
import { listParameterMemory, upsertParameterMemory } from "@/lib/parameterMemory";

export async function GET() {
  return NextResponse.json(await listParameterMemory());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await upsertParameterMemory(body));
}
TS

echo "🧩 Pages ..."
cat > app/opportunities/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function OpportunitiesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunities</h1>
        <p className="sub">Normierte Ausschreibungsobjekte mit Zuständigkeit, Kalkulationslogik und offenen Variablen.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Entscheidung</th>
                <th>Kalkulationsmodus</th>
                <th>Offene Variablen</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.title}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.decision}</td>
                  <td>{x.calcMode}</td>
                  <td>{x.missingVariableCount}</td>
                  <td>{x.ownerId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
TSX

cat > app/missing-variables/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function MissingVariablesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Volumen, Stunden, Fläche, Fristen, Direktlinks und Kalkulationsparameter.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Frage</th>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.question}</td>
                  <td>{x.type}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.priority}</td>
                  <td>{x.ownerId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
TSX

cat > app/parameter-memory/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function ParameterMemoryPage() {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Parameter Memory</h1>
        <p className="sub">Regionale und gewerk-spezifische Sätze, Richtwerte und Kalkulationsparameter.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Wert</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any, i: number) => (
                <tr key={x.id || i}>
                  <td>{x.type}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.value ?? "-"}</td>
                  <td>{x.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧩 Harden dashboard data passing ..."
python3 - <<'PY'
from pathlib import Path
p = Path("lib/dashboardWorkbench.ts")
text = p.read_text()

if 'import { safeHref, toPlain } from "@/lib/serializers";' not in text:
    text = text.replace(
        'import { readStore } from "@/lib/storage";',
        'import { readStore } from "@/lib/storage";\nimport { safeHref, toPlain } from "@/lib/serializers";'
    )

text = text.replace('      href: hit.externalResolvedUrl || resolveInternalHref({', '      href: safeHref(hit.externalResolvedUrl, resolveInternalHref({')
text = text.replace('      })', '      }))', 1)

text = text.replace('          href: focusHits[0].href,', '          href: safeHref(focusHits[0].href),')
text = text.replace('          href: longRuns[0].href,', '          href: safeHref(longRuns[0].href),')
text = text.replace('          href: noBidRows[0].href,', '          href: safeHref(noBidRows[0].href),')
text = text.replace('          href: coverageGaps[0].href,', '          href: safeHref(coverageGaps[0].href),')

text = text.replace('      href: `/?trade=${encodeURIComponent(trade || "Alle")}`', '      href: safeHref(`/?trade=${encodeURIComponent(trade || "Alle")}`)')

text = text.replace('      href: `/source-hits?trade=${encodeURIComponent(trade)}&region=${encodeURIComponent(region)}`', '      href: safeHref(`/source-hits?trade=${encodeURIComponent(trade)}&region=${encodeURIComponent(region)}`)')

text = text.replace('      ...x,\n      href: x?.href || x?.externalResolvedUrl ||', '      ...toPlain(x),\n      href: safeHref(x?.href || x?.externalResolvedUrl ||')
text = text.replace('      ...x,\n      href: x?.href || x?.externalResolvedUrl ||', '      ...toPlain(x),\n      href: safeHref(x?.href || x?.externalResolvedUrl ||', 1)
text = text.replace('      ...x,\n      href: x?.href || x?.externalResolvedUrl ||', '      ...toPlain(x),\n      href: safeHref(x?.href || x?.externalResolvedUrl ||', 1)
text = text.replace('      ...x,\n      href: x?.href || x?.externalResolvedUrl ||', '      ...toPlain(x),\n      href: safeHref(x?.href || x?.externalResolvedUrl ||', 1)

p.write_text(text)
print("dashboardWorkbench hardened")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()

text = text.replace(
    'href={row?.href || `/?trade=${encodeURIComponent(row?.trade || "Alle")}`}',
    'href={String(row?.href || `/?trade=${encodeURIComponent(row?.trade || "Alle")}`)}'
)
text = text.replace(
    'href={row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}',
    'href={String(row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`)}'
)

p.write_text(text)
print("app/page.tsx hardened")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("components/dashboard/WorkbenchInsights.tsx")
text = p.read_text()
text = text.replace(
    'href={x.href || x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`}',
    'href={String(x.href || x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`)}'
)
p.write_text(text)
print("WorkbenchInsights hardened")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("components/dashboard/WorkbenchSidebarRight.tsx")
text = p.read_text()
text = text.replace(
    'href={item?.href || "/source-hits"}',
    'href={String(item?.href || "/source-hits")}'
)
p.write_text(text)
print("WorkbenchSidebarRight hardened")
PY

echo "🧩 Navigation ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/layout.tsx")
text = p.read_text()
if '"/opportunities"' not in text:
    text = text.replace(
        '{ href: "/config", label: "Config" },',
        '{ href: "/config", label: "Config" },\n  { href: "/opportunities", label: "Opportunities" },\n  { href: "/missing-variables", label: "Variablen" },\n  { href: "/parameter-memory", label: "Parameter" },'
    )
p.write_text(text)
print("layout nav updated")
PY

npm run build || true
git add lib/serializers.ts lib/opportunitySchema.ts lib/missingVariables.ts lib/parameterMemory.ts lib/assignmentEngine.ts lib/opportunityRebuild.ts app/api/opportunities/rebuild/route.ts app/api/missing-variables/route.ts app/api/parameter-memory/route.ts app/opportunities/page.tsx app/missing-variables/page.tsx app/parameter-memory/page.tsx lib/dashboardWorkbench.ts app/page.tsx components/dashboard/WorkbenchInsights.tsx components/dashboard/WorkbenchSidebarRight.tsx app/layout.tsx
git commit -m "feat: add opportunity schema and missing variable workflow plus harden dashboard links and serialization" || true
git push origin main || true

echo "✅ Crash Fix + Ausschreibungsverständnis Slice eingebaut."
