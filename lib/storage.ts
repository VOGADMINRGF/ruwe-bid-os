import { hasMongo } from "./env";
import { getMongoDb } from "./mongo";
import { readJsonDb, writeJsonDb, createId } from "./db";
import { buildGraphEdgesFromDb, buildGraphNodesFromDb } from "./graph";

const COLLECTIONS = [
  "meta",
  "config",
  "sourceRegistry",
  "sourceStats",
  "sourceHits",
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

function baseDemoData() {
  return {
    meta: {
      appName: "RUWE Bid OS",
      version: "demo-fallback",
      lastSuccessfulIngestionAt: "2026-04-09T11:05:00.000Z",
      lastSuccessfulIngestionSource: "TED Search API"
    },
    config: {},
    sourceRegistry: [
      { id: "src_ted", name: "TED Search API", type: "api", official: true, authRequired: false, legalUse: "hoch" },
      { id: "src_service_bund", name: "service.bund.de RSS", type: "rss", official: true, authRequired: false, legalUse: "mittel" },
      { id: "src_berlin", name: "Vergabeplattform Berlin", type: "portal_rss", official: true, authRequired: false, legalUse: "mittel" },
      { id: "src_dtvp", name: "DTVP", type: "portal", official: true, authRequired: false, legalUse: "vorsicht" }
    ],
    sourceStats: [
      { id: "src_ted", lastFetchAt: "2026-04-09T11:05:00.000Z", tendersLast30Days: 28, tendersSinceLastFetch: 5, prefilteredLast30Days: 11, goLast30Days: 4, errorCountLastRun: 0, duplicateCountLastRun: 1, lastRunOk: true },
      { id: "src_service_bund", lastFetchAt: "2026-04-09T10:52:00.000Z", tendersLast30Days: 19, tendersSinceLastFetch: 3, prefilteredLast30Days: 7, goLast30Days: 2, errorCountLastRun: 0, duplicateCountLastRun: 0, lastRunOk: true },
      { id: "src_berlin", lastFetchAt: "2026-04-09T10:35:00.000Z", tendersLast30Days: 13, tendersSinceLastFetch: 2, prefilteredLast30Days: 4, goLast30Days: 1, errorCountLastRun: 0, duplicateCountLastRun: 0, lastRunOk: true },
      { id: "src_dtvp", lastFetchAt: "2026-04-09T10:10:00.000Z", tendersLast30Days: 9, tendersSinceLastFetch: 1, prefilteredLast30Days: 2, goLast30Days: 0, errorCountLastRun: 1, duplicateCountLastRun: 0, lastRunOk: false }
    ],
    sourceHits: [
      { id: "hit1", sourceId: "src_ted", title: "Unterhaltsreinigung Verwaltungsstandorte Berlin Ost", region: "Berlin", postalCode: "13055", trade: "Reinigung", estimatedValue: 920000, durationMonths: 24, distanceKm: 7, matchedSiteId: "bh_nordost", status: "prefiltered", addedSinceLastFetch: true, url: "https://ted.europa.eu/" },
      { id: "hit2", sourceId: "src_ted", title: "Hausmeister- und Objektservice Bezirksimmobilien Mitte", region: "Berlin", postalCode: "12055", trade: "Hausmeister", estimatedValue: 540000, durationMonths: 36, distanceKm: 5, matchedSiteId: "bh_mitte", status: "manual_review", addedSinceLastFetch: true, url: "https://ted.europa.eu/" },
      { id: "hit3", sourceId: "src_service_bund", title: "Sicherheitsdienst Verwaltungsobjekte Magdeburg", region: "Magdeburg", postalCode: "39104", trade: "Sicherheit", estimatedValue: 1200000, durationMonths: 24, distanceKm: 4, matchedSiteId: "nl_magdeburg", status: "prefiltered", addedSinceLastFetch: true, url: "https://service.bund.de/" },
      { id: "hit4", sourceId: "src_service_bund", title: "Winterdienst kommunale Flächen Schkeuditz", region: "Schkeuditz", postalCode: "04435", trade: "Winterdienst", estimatedValue: 310000, durationMonths: 12, distanceKm: 2, matchedSiteId: "nl_schkeuditz", status: "prefiltered", addedSinceLastFetch: true, url: "https://service.bund.de/" },
      { id: "hit5", sourceId: "src_berlin", title: "Pflege und Unterhaltung Grünflächen Südwest", region: "Stahnsdorf / Potsdam", postalCode: "14532", trade: "Grünpflege", estimatedValue: 440000, durationMonths: 18, distanceKm: 3, matchedSiteId: "bh_suedwest", status: "prefiltered", addedSinceLastFetch: true, url: "https://www.berlin.de/vergabeplattform/" },
      { id: "hit6", sourceId: "src_ted", title: "Gebäudereinigung Zeitz / Südachsen-Anhalt", region: "Zeitz", postalCode: "06712", trade: "Reinigung", estimatedValue: 610000, durationMonths: 24, distanceKm: 2, matchedSiteId: "nl_zeitz", status: "prefiltered", addedSinceLastFetch: true, url: "https://ted.europa.eu/" },
      { id: "hit7", sourceId: "src_service_bund", title: "Objektschutz landeseigene Liegenschaften", region: "Magdeburg", postalCode: "39106", trade: "Sicherheit", estimatedValue: 870000, durationMonths: 24, distanceKm: 1, matchedSiteId: "nl_magdeburg", status: "observed", addedSinceLastFetch: false, url: "https://service.bund.de/" },
      { id: "hit8", sourceId: "src_berlin", title: "Hauswartung Verwaltungseinheiten Neukölln", region: "Berlin", postalCode: "12057", trade: "Hausmeister", estimatedValue: 260000, durationMonths: 24, distanceKm: 1, matchedSiteId: "bh_mitte", status: "manual_review", addedSinceLastFetch: false, url: "https://www.berlin.de/vergabeplattform/" },
      { id: "hit9", sourceId: "src_dtvp", title: "Reinigung mittlere Verwaltungsobjekte Brandenburg Süd", region: "Brandenburg Süd", postalCode: "15834", trade: "Reinigung", estimatedValue: 290000, durationMonths: 12, distanceKm: 17, matchedSiteId: "bh_suedost", status: "observed", addedSinceLastFetch: true, url: "https://www.dtvp.de/" },
      { id: "hit10", sourceId: "src_ted", title: "Glasreinigung Schulstandorte Ost", region: "Berlin", postalCode: "12681", trade: "Glasreinigung", estimatedValue: 380000, durationMonths: 12, distanceKm: 6, matchedSiteId: "bh_nordost", status: "observed", addedSinceLastFetch: true, url: "https://ted.europa.eu/" },
      { id: "hit11", sourceId: "src_service_bund", title: "Baumpflege und Grünservice kommunale Flächen", region: "Stahnsdorf", postalCode: "14532", trade: "Grünpflege", estimatedValue: 330000, durationMonths: 18, distanceKm: 4, matchedSiteId: "bh_suedwest", status: "manual_review", addedSinceLastFetch: true, url: "https://service.bund.de/" }
    ],
    sites: [
      { id: "bh_nordost", name: "Betriebshof Nord-Ost", city: "Berlin", postalCode: "13053", state: "Berlin", type: "Betriebshof", active: true, primaryRadiusKm: 18, secondaryRadiusKm: 30, notes: "Reinigung / Glas / Ost" },
      { id: "bh_nordwest", name: "Betriebshof Nord-West", city: "Berlin", postalCode: "13599", state: "Berlin", type: "Betriebshof", active: true, primaryRadiusKm: 18, secondaryRadiusKm: 30, notes: "West" },
      { id: "bh_mitte", name: "Betriebshof Mitte", city: "Berlin", postalCode: "12057", state: "Berlin", type: "Betriebshof", active: true, primaryRadiusKm: 15, secondaryRadiusKm: 25, notes: "Hausmeister / Hauswart" },
      { id: "bh_suedost", name: "Betriebshof Süd-Ost", city: "Groß Kienitz", postalCode: "15831", state: "Brandenburg", type: "Betriebshof", active: true, primaryRadiusKm: 25, secondaryRadiusKm: 40, notes: "Südost" },
      { id: "bh_suedwest", name: "Betriebshof Süd-West", city: "Stahnsdorf", postalCode: "14532", state: "Brandenburg", type: "Betriebshof", active: true, primaryRadiusKm: 25, secondaryRadiusKm: 40, notes: "Südwest / Grün" },
      { id: "nl_magdeburg", name: "Niederlassung Magdeburg", city: "Magdeburg", postalCode: "39106", state: "Sachsen-Anhalt", type: "Niederlassung", active: true, primaryRadiusKm: 35, secondaryRadiusKm: 55, notes: "Sicherheit" },
      { id: "nl_schkeuditz", name: "Niederlassung Schkeuditz", city: "Schkeuditz", postalCode: "04435", state: "Sachsen", type: "Niederlassung", active: true, primaryRadiusKm: 35, secondaryRadiusKm: 60, notes: "Winterdienst / Sachsen" },
      { id: "nl_zeitz", name: "Niederlassung Zeitz", city: "Zeitz", postalCode: "06712", state: "Sachsen-Anhalt", type: "Niederlassung", active: true, primaryRadiusKm: 35, secondaryRadiusKm: 60, notes: "Zeitz" },
      { id: "nl_hbo", name: "HBO GmbH", city: "Torgau", postalCode: "04860", state: "Sachsen", type: "Gesellschaft", active: true, primaryRadiusKm: 45, secondaryRadiusKm: 70, notes: "Facility / Reinigung" },
      { id: "nl_gs", name: "G&S", city: "Crimmitschau", postalCode: "08451", state: "Sachsen", type: "Gesellschaft", active: true, primaryRadiusKm: 40, secondaryRadiusKm: 65, notes: "Objektservice" },
      { id: "nl_tue", name: "TÜ Gebäudeservice", city: "Limbach-Oberfrohna", postalCode: "09212", state: "Sachsen", type: "Gesellschaft", active: true, primaryRadiusKm: 40, secondaryRadiusKm: 65, notes: "Gebäudeservice" }
    ],
    serviceAreas: [],
    siteTradeRules: [
      { id: "rule_nordost_reinigung", siteId: "bh_nordost", trade: "Reinigung", priority: "hoch", primaryRadiusKm: 18, secondaryRadiusKm: 30, tertiaryRadiusKm: 45, monthlyCapacity: 18, concurrentCapacity: 7, enabled: true, keywordsPositive: ["gebäudereinigung", "unterhaltsreinigung", "glasreinigung"], keywordsNegative: [] },
      { id: "rule_nordost_glas", siteId: "bh_nordost", trade: "Glasreinigung", priority: "mittel", primaryRadiusKm: 18, secondaryRadiusKm: 30, tertiaryRadiusKm: 45, monthlyCapacity: 10, concurrentCapacity: 4, enabled: true, keywordsPositive: ["glasreinigung"], keywordsNegative: [] },
      { id: "rule_mitte_hausmeister", siteId: "bh_mitte", trade: "Hausmeister", priority: "hoch", primaryRadiusKm: 15, secondaryRadiusKm: 25, tertiaryRadiusKm: 40, monthlyCapacity: 10, concurrentCapacity: 4, enabled: true, keywordsPositive: ["hausmeister", "hauswart"], keywordsNegative: [] },
      { id: "rule_magdeburg_sicherheit", siteId: "nl_magdeburg", trade: "Sicherheit", priority: "hoch", primaryRadiusKm: 35, secondaryRadiusKm: 55, tertiaryRadiusKm: 75, monthlyCapacity: 8, concurrentCapacity: 3, enabled: true, keywordsPositive: ["objektschutz", "sicherheitsdienst"], keywordsNegative: [] },
      { id: "rule_schkeuditz_winter", siteId: "nl_schkeuditz", trade: "Winterdienst", priority: "mittel", primaryRadiusKm: 35, secondaryRadiusKm: 60, tertiaryRadiusKm: 80, monthlyCapacity: 6, concurrentCapacity: 2, enabled: true, keywordsPositive: ["winterdienst"], keywordsNegative: [] },
      { id: "rule_suedwest_gruen", siteId: "bh_suedwest", trade: "Grünpflege", priority: "mittel", primaryRadiusKm: 25, secondaryRadiusKm: 40, tertiaryRadiusKm: 55, monthlyCapacity: 7, concurrentCapacity: 3, enabled: true, keywordsPositive: ["grünpflege", "baumpflege"], keywordsNegative: [] },
      { id: "rule_hbo_facility", siteId: "nl_hbo", trade: "Facility", priority: "hoch", primaryRadiusKm: 45, secondaryRadiusKm: 70, tertiaryRadiusKm: 90, monthlyCapacity: 14, concurrentCapacity: 6, enabled: true, keywordsPositive: ["facility", "objektservice"], keywordsNegative: [] },
      { id: "rule_hbo_reinigung", siteId: "nl_hbo", trade: "Reinigung", priority: "hoch", primaryRadiusKm: 45, secondaryRadiusKm: 70, tertiaryRadiusKm: 90, monthlyCapacity: 16, concurrentCapacity: 7, enabled: true, keywordsPositive: ["unterhaltsreinigung"], keywordsNegative: [] },
      { id: "rule_gs_objekt", siteId: "nl_gs", trade: "Objektservice", priority: "mittel", primaryRadiusKm: 40, secondaryRadiusKm: 65, tertiaryRadiusKm: 80, monthlyCapacity: 8, concurrentCapacity: 3, enabled: true, keywordsPositive: ["objektservice"], keywordsNegative: [] },
      { id: "rule_tue_gebaeude", siteId: "nl_tue", trade: "Gebäudeservice", priority: "mittel", primaryRadiusKm: 40, secondaryRadiusKm: 65, tertiaryRadiusKm: 80, monthlyCapacity: 8, concurrentCapacity: 3, enabled: true, keywordsPositive: ["gebäudeservice"], keywordsNegative: [] }
    ],
    buyers: [
      { id: "buyer1", name: "Land Berlin", type: "Öffentlich", strategic: true },
      { id: "buyer2", name: "Stadt Magdeburg", type: "Öffentlich", strategic: true }
    ],
    agents: [
      { id: "agent1", name: "Agent Nord/Ost", focus: "Berlin Ost Reinigung", level: "Koordinator", winRate: 0.41, pipelineValue: 1800000 },
      { id: "agent2", name: "Agent Berlin Mitte", focus: "Hausmeister", level: "Koordinator", winRate: 0.37, pipelineValue: 900000 },
      { id: "agent3", name: "Agent Sachsen", focus: "Facility/Reinigung", level: "Spezialist", winRate: 0.29, pipelineValue: 1200000 },
      { id: "agent4", name: "Agent Sicherheit", focus: "Magdeburg", level: "Spezialist", winRate: 0.24, pipelineValue: 800000 },
      { id: "agent5", name: "Assistenz A", focus: "Ausschreibungsmonitoring", level: "Assistenz", winRate: 0.12, pipelineValue: 0 },
      { id: "agent6", name: "Assistenz B", focus: "Vorprüfung/Keywords", level: "Assistenz", winRate: 0.10, pipelineValue: 0 }
    ],
    tenders: [
      { id: "t1", title: "Unterhaltsreinigung Verwaltungsstandorte Berlin Ost", region: "Berlin", trade: "Reinigung", decision: "Go", manualReview: "nein", distanceKm: 7, dueDate: "2026-04-20", buyerId: "buyer1", ownerId: "agent1" },
      { id: "t2", title: "Hausmeister- und Objektservice Bezirksimmobilien Mitte", region: "Berlin", trade: "Hausmeister", decision: "Prüfen", manualReview: "zwingend", distanceKm: 5, dueDate: "2026-04-18", buyerId: "buyer1", ownerId: "agent2" },
      { id: "t3", title: "Sicherheitsdienst Verwaltungsobjekte Magdeburg", region: "Magdeburg", trade: "Sicherheit", decision: "Go", manualReview: "optional", distanceKm: 4, dueDate: "2026-04-25", buyerId: "buyer2", ownerId: "agent4" }
    ],
    pipeline: [
      { id: "p1", title: "Berlin Ost Reinigung", stage: "Angebot", value: 920000, ownerId: "agent1" },
      { id: "p2", title: "Magdeburg Sicherheit", stage: "Verhandlung", value: 1200000, ownerId: "agent4" },
      { id: "p3", title: "Torgau Facility Cluster", stage: "Qualifizierung", value: 700000, ownerId: "agent3" }
    ],
    references: [
      { id: "ref1", title: "Gebäudereinigung öffentliche Hand", trade: "Reinigung", region: "Berlin" },
      { id: "ref2", title: "Sicherheitsdienste Verwaltung", trade: "Sicherheit", region: "Magdeburg" }
    ]
  };
}

function demoFallback() {
  const base = baseDemoData();
  return {
    ...base,
    graphNodes: buildGraphNodesFromDb(base),
    graphEdges: buildGraphEdgesFromDb(base)
  };
}

async function ensureMongoSeededFromJson() {
  if (!hasMongo()) return;

  const db = await getMongoDb();
  const existing = await db.collection("meta").countDocuments();
  if (existing > 0) return;

  const json = await readJsonDb();
  const demo = demoFallback();

  const mergedCore = {
    ...baseDemoData(),
    ...json
  };

  const finalStore = {
    ...mergedCore,
    graphNodes: buildGraphNodesFromDb(mergedCore),
    graphEdges: buildGraphEdgesFromDb(mergedCore)
  };

  const docs: Record<string, any[]> = {
    meta: [finalStore.meta || {}],
    config: [finalStore.config || {}],
    sourceRegistry: finalStore.sourceRegistry || [],
    sourceStats: finalStore.sourceStats || [],
    sourceHits: finalStore.sourceHits || [],
    sites: finalStore.sites || [],
    serviceAreas: finalStore.serviceAreas || [],
    siteTradeRules: finalStore.siteTradeRules || [],
    buyers: finalStore.buyers || [],
    agents: finalStore.agents || [],
    tenders: finalStore.tenders || [],
    pipeline: finalStore.pipeline || [],
    references: finalStore.references || [],
    graphNodes: finalStore.graphNodes || demo.graphNodes || [],
    graphEdges: finalStore.graphEdges || demo.graphEdges || []
  };

  for (const [name, list] of Object.entries(docs)) {
    await db.collection(name).deleteMany({});
    if (list.length) {
      await db.collection(name).insertMany(stampRows(list));
    }
  }
}

export async function readStore() {
  if (!hasMongo()) {
    const json = await readJsonDb();
    const mergedCore = { ...baseDemoData(), ...json };
    return {
      ...mergedCore,
      graphNodes: buildGraphNodesFromDb(mergedCore),
      graphEdges: buildGraphEdgesFromDb(mergedCore)
    };
  }

  const db = await getMongoDb();
  await ensureMongoSeededFromJson();

  const result: any = {};
  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    if (name === "meta" || name === "config") {
      result[name] = docs[0] ? stripMongo(docs[0]) : {};
    } else {
      result[name] = docs.map(stripMongo);
    }
  }

  const demo = demoFallback();
  for (const name of COLLECTIONS) {
    if (name === "meta" || name === "config") {
      if (!result[name] || Object.keys(result[name]).length === 0) result[name] = demo[name] || {};
    } else {
      if (!Array.isArray(result[name]) || result[name].length === 0) result[name] = demo[name] || [];
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
  const stampedPatch = { ...patch, updatedAt: new Date().toISOString() };

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
