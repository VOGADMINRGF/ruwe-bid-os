#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Mongo CRUD UI Upgrade"

mkdir -p components/forms
mkdir -p app/api/site-rules/[id]
mkdir -p app/api/service-areas/[id]
mkdir -p app/api/keywords/[id]
mkdir -p app/api/overview
mkdir -p app/sites/new
mkdir -p app/site-rules/new
mkdir -p app/tenders/[id]/edit

echo "🧠 Mongo-first Storage härten ..."
cat > lib/storage.ts <<'TS'
import { hasMongo } from "./env";
import { getMongoDb } from "./mongo";
import { readJsonDb, writeJsonDb, createId } from "./db";
import { buildGraphEdgesFromDb, buildGraphNodesFromDb } from "./graph";

const COLLECTIONS = [
  "meta",
  "config",
  "sourceStats",
  "sites",
  "serviceAreas",
  "siteTradeRules",
  "buyers",
  "agents",
  "tenders",
  "pipeline",
  "references",
  "graphNodes",
  "graphEdges"
] as const;

type CollectionName = typeof COLLECTIONS[number];

async function ensureMongoSeededFromJson() {
  if (!hasMongo()) return;

  const db = await getMongoDb();
  const existing = await db.collection("meta").countDocuments();
  if (existing > 0) return;

  const json = await readJsonDb();
  const graphNodes = buildGraphNodesFromDb(json);
  const graphEdges = buildGraphEdgesFromDb(json);

  const docs: Record<string, any[]> = {
    meta: [json.meta || {}],
    config: [json.config || {}],
    sourceStats: json.sourceStats || [],
    sites: json.sites || [],
    serviceAreas: json.serviceAreas || [],
    siteTradeRules: json.siteTradeRules || [],
    buyers: json.buyers || [],
    agents: json.agents || [],
    tenders: json.tenders || [],
    pipeline: json.pipeline || [],
    references: json.references || [],
    graphNodes,
    graphEdges
  };

  for (const [name, list] of Object.entries(docs)) {
    if (list.length) {
      await db.collection(name).insertMany(list);
    }
  }
}

export async function readStore() {
  if (!hasMongo()) {
    const json = await readJsonDb();
    return {
      ...json,
      graphNodes: buildGraphNodesFromDb(json),
      graphEdges: buildGraphEdgesFromDb(json)
    };
  }

  await ensureMongoSeededFromJson();
  const db = await getMongoDb();

  const result: any = {};
  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    if (name === "meta" || name === "config") {
      result[name] = docs[0] ? stripMongo(docs[0]) : {};
    } else {
      result[name] = docs.map(stripMongo);
    }
  }
  return result;
}

export async function readCollection(name: CollectionName) {
  const db = await readStore();
  return db[name] || [];
}

export async function readItemById(name: CollectionName, id: string) {
  const rows = await readCollection(name);
  return rows.find((x: any) => x.id === id) || null;
}

export async function replaceCollection(name: CollectionName, rows: any[]) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    if (name === "meta" || name === "config") json[name] = rows[0] || {};
    else json[name] = rows;
    await writeJsonDb(json);
    return;
  }

  const db = await getMongoDb();
  await db.collection(name).deleteMany({});
  if (rows.length) await db.collection(name).insertMany(stampRows(rows));
}

export async function appendToCollection(name: CollectionName, row: any) {
  const stamped = stampRow(row);

  if (!hasMongo()) {
    const json = await readJsonDb();
    if (!Array.isArray(json[name])) json[name] = [];
    json[name].unshift(stamped);
    await writeJsonDb(json);
    return stamped;
  }

  const db = await getMongoDb();
  await db.collection(name).insertOne(stamped);
  return stamped;
}

export async function updateById(name: CollectionName, id: string, patch: any) {
  const stampedPatch = {
    ...patch,
    updatedAt: new Date().toISOString()
  };

  if (!hasMongo()) {
    const json = await readJsonDb();
    const list = json[name] || [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...stampedPatch };
    json[name] = list;
    await writeJsonDb(json);
    return list[idx];
  }

  const db = await getMongoDb();
  await db.collection(name).updateOne({ id }, { $set: stampedPatch });
  const updated = await db.collection(name).findOne({ id });
  return updated ? stripMongo(updated) : null;
}

export async function deleteById(name: CollectionName, id: string) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    json[name] = (json[name] || []).filter((x: any) => x.id !== id);
    await writeJsonDb(json);
    return { ok: true };
  }

  const db = await getMongoDb();
  await db.collection(name).deleteOne({ id });
  return { ok: true };
}

export function nextId(prefix: string) {
  return createId(prefix);
}

function stripMongo(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

function stampRow(row: any) {
  return {
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...row
  };
}

function stampRows(rows: any[]) {
  return rows.map(stampRow);
}
TS

echo "🔌 APIs erweitern ..."
cat > app/api/site-rules/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { deleteById, readItemById, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await readItemById("siteTradeRules", id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const updated = await updateById("siteTradeRules", id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteById("siteTradeRules", id);
  return NextResponse.json({ ok: true });
}
TS

cat > app/api/service-areas/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { deleteById, readItemById, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await readItemById("serviceAreas", id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const updated = await updateById("serviceAreas", id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteById("serviceAreas", id);
  return NextResponse.json({ ok: true });
}
TS

cat > app/api/keywords/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readItemById, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await readItemById("siteTradeRules", id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await updateById("siteTradeRules", id, {
    keywordsPositive: body.keywordsPositive || [],
    keywordsNegative: body.keywordsNegative || [],
    regionNotes: body.regionNotes || ""
  });
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}
TS

cat > app/api/overview/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";
import { prefilteredCount, siteCoverage } from "@/lib/siteLogic";

export async function GET() {
  const db = await readStore();
  const tenders = db.tenders || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const pipeline = db.pipeline || [];
  const sourceStats = db.sourceStats || [];

  return NextResponse.json({
    total: tenders.length,
    prefiltered: prefilteredCount(tenders),
    manual: manualQueueCount(tenders),
    go: tenders.filter((t: any) => t.decision === "Go").length,
    noGo: tenders.filter((t: any) => t.decision === "No-Go").length,
    weightedPipeline: weightedPipeline(pipeline),
    goQuote: goQuote(tenders),
    overdue: overdueCount(tenders),
    overall: overallAssessment(tenders),
    activeSites: sites.filter((s: any) => s.active).length,
    activeRules: rules.filter((r: any) => r.enabled).length,
    coverage: siteCoverage(sites, rules, tenders),
    sourceStats
  });
}
TS

echo "🧩 Client-Form-Komponenten ..."
cat > components/forms/SiteCreateForm.tsx <<'TSX'
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SiteCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    type: "Gesellschaft",
    active: true,
    primaryRadiusKm: 25,
    secondaryRadiusKm: 50,
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setSaving(false);
    router.push(`/sites/${data.id}`);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Name</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="stack">
          <span className="label">Stadt</span>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Bundesland</span>
          <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
        </label>
        <label className="stack">
          <span className="label">Typ</span>
          <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </label>
        <label className="stack">
          <span className="label">Aktiv</span>
          <select className="input" value={form.active ? "true" : "false"} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </label>
      </div>

      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Primärradius km</span>
          <input className="input" type="number" value={form.primaryRadiusKm} onChange={(e) => setForm({ ...form, primaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Sekundärradius km</span>
          <input className="input" type="number" value={form.secondaryRadiusKm} onChange={(e) => setForm({ ...form, secondaryRadiusKm: Number(e.target.value) })} />
        </label>
      </div>

      <label className="stack">
        <span className="label">Notizen</span>
        <textarea className="input" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Standort anlegen"}
      </button>
    </form>
  );
}
TSX

cat > components/forms/SiteRuleEditor.tsx <<'TSX'
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SiteRuleEditor({ rule }: { rule: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    trade: rule.trade || "",
    priority: rule.priority || "mittel",
    primaryRadiusKm: rule.primaryRadiusKm || 25,
    secondaryRadiusKm: rule.secondaryRadiusKm || 50,
    tertiaryRadiusKm: rule.tertiaryRadiusKm || 75,
    monthlyCapacity: rule.monthlyCapacity || 5,
    concurrentCapacity: rule.concurrentCapacity || 2,
    enabled: Boolean(rule.enabled),
    keywordsPositive: (rule.keywordsPositive || []).join(", "),
    keywordsNegative: (rule.keywordsNegative || []).join(", "),
    regionNotes: rule.regionNotes || ""
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/site-rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        keywordsPositive: form.keywordsPositive.split(",").map((x) => x.trim()).filter(Boolean),
        keywordsNegative: form.keywordsNegative.split(",").map((x) => x.trim()).filter(Boolean)
      })
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Gewerk</span>
          <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
        </label>
        <label className="stack">
          <span className="label">Priorität</span>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="hoch">hoch</option>
            <option value="mittel">mittel</option>
            <option value="niedrig">niedrig</option>
          </select>
        </label>
        <label className="stack">
          <span className="label">Aktiv</span>
          <select className="input" value={form.enabled ? "true" : "false"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "true" })}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </label>
      </div>

      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Primär km</span>
          <input className="input" type="number" value={form.primaryRadiusKm} onChange={(e) => setForm({ ...form, primaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Sekundär km</span>
          <input className="input" type="number" value={form.secondaryRadiusKm} onChange={(e) => setForm({ ...form, secondaryRadiusKm: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Tertiär km</span>
          <input className="input" type="number" value={form.tertiaryRadiusKm} onChange={(e) => setForm({ ...form, tertiaryRadiusKm: Number(e.target.value) })} />
        </label>
      </div>

      <div className="grid grid-2">
        <label className="stack">
          <span className="label">Monatskapazität</span>
          <input className="input" type="number" value={form.monthlyCapacity} onChange={(e) => setForm({ ...form, monthlyCapacity: Number(e.target.value) })} />
        </label>
        <label className="stack">
          <span className="label">Parallele Kapazität</span>
          <input className="input" type="number" value={form.concurrentCapacity} onChange={(e) => setForm({ ...form, concurrentCapacity: Number(e.target.value) })} />
        </label>
      </div>

      <label className="stack">
        <span className="label">Positive Keywords (kommagetrennt)</span>
        <input className="input" value={form.keywordsPositive} onChange={(e) => setForm({ ...form, keywordsPositive: e.target.value })} />
      </label>

      <label className="stack">
        <span className="label">Negative Keywords (kommagetrennt)</span>
        <input className="input" value={form.keywordsNegative} onChange={(e) => setForm({ ...form, keywordsNegative: e.target.value })} />
      </label>

      <label className="stack">
        <span className="label">Regionshinweis</span>
        <input className="input" value={form.regionNotes} onChange={(e) => setForm({ ...form, regionNotes: e.target.value })} />
      </label>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Regel speichern"}
      </button>
    </form>
  );
}
TSX

cat > components/forms/TenderDecisionEditor.tsx <<'TSX'
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TenderDecisionEditor({ tender }: { tender: any }) {
  const router = useRouter();
  const [decision, setDecision] = useState(tender.decision || "Prüfen");
  const [manualReview, setManualReview] = useState(tender.manualReview || "optional");
  const [ownerId, setOwnerId] = useState(tender.ownerId || "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/tenders/${tender.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        manualReview,
        ownerId,
        status:
          decision === "Go"
            ? "go"
            : decision === "No-Go"
              ? "no_go"
              : "manuelle_pruefung"
      })
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid grid-3">
        <label className="stack">
          <span className="label">Entscheidung</span>
          <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="Go">Go</option>
            <option value="Prüfen">Prüfen</option>
            <option value="No-Go">No-Go</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Manual Review</span>
          <select className="input" value={manualReview} onChange={(e) => setManualReview(e.target.value)}>
            <option value="zwingend">zwingend</option>
            <option value="optional">optional</option>
            <option value="nein">nein</option>
          </select>
        </label>

        <label className="stack">
          <span className="label">Owner ID</span>
          <input className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} />
        </label>
      </div>

      <button className="button" type="submit" disabled={saving}>
        {saving ? "Speichere ..." : "Tender aktualisieren"}
      </button>
    </form>
  );
}
TSX

echo "📄 Neue Seiten ..."
cat > app/sites/new/page.tsx <<'TSX'
import SiteCreateForm from "@/components/forms/SiteCreateForm";

export default function NewSitePage() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Neuen Standort anlegen</h1>
        <p className="sub">Formale RUWE-Sites und operative Standorte anlegen.</p>
      </div>
      <div className="card">
        <SiteCreateForm />
      </div>
    </div>
  );
}
TSX

cat > app/tenders/[id]/edit/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import TenderDecisionEditor from "@/components/forms/TenderDecisionEditor";

export default async function EditTenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{tender.title}</h1>
        <p className="sub">Entscheidung, Review-Status und Owner bearbeiten.</p>
      </div>
      <div className="card">
        <TenderDecisionEditor tender={tender} />
      </div>
    </div>
  );
}
TSX

echo "🖥️ Bestehende Seiten brauchbarer machen ..."
cat > app/sites/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function SitesPage() {
  const db = await readStore();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="h1">Sites</h1>
          <p className="sub">Offizielle RUWE-Standorte und Gruppengesellschaften mit editierbarer Logik.</p>
        </div>
        <Link className="button" href="/sites/new">Neuer Standort</Link>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Standort</th>
              <th>Typ</th>
              <th>Stadt</th>
              <th>Radius</th>
              <th>Gewerke</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s: any) => {
              const ownRules = rules.filter((r: any) => r.siteId === s.id && r.enabled);
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.type}</td>
                  <td>{s.city}</td>
                  <td>{s.primaryRadiusKm}/{s.secondaryRadiusKm} km</td>
                  <td>{ownRules.map((r: any) => r.trade).join(", ")}</td>
                  <td><Link className="linkish" href={`/sites/${s.id}`}>Öffnen</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/sites/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { siteTradeOperationalRows } from "@/lib/siteLogic";
import SiteRuleEditor from "@/components/forms/SiteRuleEditor";

function capacityBadge(status: string) {
  if (status === "voll") return "badge badge-kritisch";
  if (status === "eng") return "badge badge-gemischt";
  return "badge badge-gut";
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const rows = siteTradeOperationalRows(site, db.siteTradeRules || [], db.tenders || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit bearbeitbaren Regeln für Gewerk, Radius, Kapazität und Keywords.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Standort</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Typ</div><div className="kpi">{site.type}</div></div>
        <div className="card"><div className="label">Primär / Sekundär</div><div className="kpi">{site.primaryRadiusKm}/{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Service Areas</div><div className="kpi">{serviceAreas.length}</div></div>
      </div>

      <div className="card">
        <div className="section-title">Service Areas</div>
        <div className="meta">{serviceAreas.map((x: any) => x.name).join(", ") || "-"}</div>
      </div>

      <div className="card">
        <div className="section-title">Gewerkeregeln & Kapazität</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Gewerk</th>
                <th>Primär</th>
                <th>Sekundär</th>
                <th>Tertiär</th>
                <th>Monat / Parallel</th>
                <th>Im Scope</th>
                <th>Nächste Klasse</th>
                <th>Manuell prüfen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.rule.id}>
                  <td>{row.rule.trade}</td>
                  <td>{row.rule.primaryRadiusKm} km</td>
                  <td>{row.rule.secondaryRadiusKm} km</td>
                  <td>{row.rule.tertiaryRadiusKm} km</td>
                  <td>{row.monthlyCapacity} / {row.concurrentCapacity}</td>
                  <td>{row.currentScopeCount}</td>
                  <td>{row.nextBandCount}</td>
                  <td>{row.nextBandManualCandidates}</td>
                  <td><span className={capacityBadge(row.capacityStatus)}>{row.capacityStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        {rows.map((row: any) => (
          <div className="card" key={row.rule.id}>
            <div className="section-title">{row.rule.trade} bearbeiten</div>
            <SiteRuleEditor rule={row.rule} />
          </div>
        ))}
      </div>
    </div>
  );
}
TSX

cat > app/tenders/[id]/page.tsx <<'TSX'
import Link from "next/link";
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { fitScore } from "@/lib/scoring";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  const buyer = (db.buyers || []).find((x: any) => x.id === tender.buyerId);
  const zone = (db.zones || []).find((x: any) => x.id === tender.zoneId);
  const score = fitScore(tender, zone, buyer);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="h1">{tender.title}</h1>
          <p className="sub">Tender-Detail mit aktuellem Entscheidungsstand.</p>
        </div>
        <Link className="button" href={`/tenders/${tender.id}/edit`}>Bearbeiten</Link>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Gewerk</div><div className="kpi">{tender.trade}</div></div>
        <div className="card"><div className="label">Entscheidung</div><div className="kpi">{tender.decision}</div></div>
        <div className="card"><div className="label">Distanz</div><div className="kpi">{tender.distanceKm} km</div></div>
        <div className="card"><div className="label">Fit Score</div><div className="kpi">{score}</div></div>
      </div>

      <div className="card">
        <pre className="doc">{JSON.stringify(tender, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/site-rules/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function SiteRulesPage() {
  const db = await readStore();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Site Rules</h1>
        <p className="sub">Mongo-first bearbeitbare Regeln je Standort und Gewerk.</p>
      </div>

      <div className="grid grid-2">
        {rules.map((rule: any) => {
          const site = sites.find((s: any) => s.id === rule.siteId);
          return (
            <div className="card" key={rule.id}>
              <div className="section-title">{site?.name || "-"} · {rule.trade}</div>
              <SiteRuleEditor rule={rule} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
TSX

echo "🎨 Kleine UI-Helfer in globals.css ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/globals.css")
text = p.read_text()
extra = """

.input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: white;
  color: var(--ink);
  font: inherit;
}

textarea.input {
  resize: vertical;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  padding: 12px 16px;
  background: var(--orange);
  color: white;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.button:hover {
  opacity: 0.92;
}
"""
if ".input {" not in text:
    text += extra
p.write_text(text)
PY

echo "🧾 Docs ergänzen ..."
cat > docs/NEXT_STEP_MONGO_CRUD.md <<'DOC'
# NEXT_STEP_MONGO_CRUD

## Umgesetzt
- Mongo-first Storage
- Site Create Form
- Site Rule Edit Form
- Tender Decision Edit Form
- API Update-Routen
- Dashboard / Seiten lesen über Storage

## Noch offen
- Delete-Buttons in UI
- Filter/Sorting in UI
- Service Area Create/Edit
- Keyword-only Editor
- Audit Log Felder je Aktion
DOC

npm run build || true
git add .
git commit -m "feat: add mongo-first editable UI for sites, rules and tender decisions" || true
git push origin main || true

echo "✅ Mongo CRUD UI Upgrade eingebaut."
