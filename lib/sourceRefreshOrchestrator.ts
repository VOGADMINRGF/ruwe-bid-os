import { fetchServiceBundRss } from "@/lib/connectors/serviceBund";
import { fetchTedNotices } from "@/lib/connectors/ted";
import { fetchBerlinBekanntmachungenRss } from "@/lib/connectors/berlin";
import { ensureQueryConfig, listQueryConfig } from "@/lib/queryConfig";
import { appendQueryRun } from "@/lib/queryHistory";
import { normalizeRegionLabel } from "@/lib/regionNormalization";
import { readStore, replaceCollection } from "@/lib/storage";
import { ensureSourceRegistryDefaults } from "@/lib/sourceControl";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { classifyTrade, detectCalcMode } from "@/lib/tradeClassification";
import { toPlain } from "@/lib/serializers";
import { appendAuditLog } from "@/lib/auditLog";

const SOURCE_NAMES: Record<string, string> = {
  src_service_bund: "service.bund.de",
  src_ted: "TED",
  src_berlin: "Vergabeplattform Berlin",
  src_dtvp: "DTVP"
};

type SourceRunResult = {
  ok: boolean;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  finishedAt: string;
  status: "done" | "warning" | "error";
  note: string;
  queryCount: number;
  rawHits: number;
  matchedHits: number;
  inserted: number;
  updated: number;
  duplicates: number;
  usableHits: number;
  invalidDirectLinks: number;
  queryResults: any[];
};

function nowIso() {
  return new Date().toISOString();
}

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function compact(text: any) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function hashId(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function fingerprint(hit: any) {
  const key = [
    String(hit?.sourceId || ""),
    String(hit?.externalResolvedUrl || hit?.detailUrl || hit?.url || ""),
    compact(hit?.title || "")
  ].join("::");
  return key.toLowerCase();
}

function parseGermanDate(raw: string) {
  const m = raw.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDueDate(value: any) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const iso = parseGermanDate(raw);
  if (iso) return iso;
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return null;
}

function extractDurationMonths(text: string, fallback: any) {
  const direct = n(fallback);
  if (direct > 0) return direct;
  const m = text.match(/\b(\d{1,3})\s*(monat|monate|months?)\b/i);
  if (m) return n(m[1]);
  const years = text.match(/\b(\d{1,2})\s*(jahr|jahre|years?)\b/i);
  if (years) return n(years[1]) * 12;
  return 0;
}

function extractLotInfo(text: string) {
  const los = text.match(/\b(los[\s\-]*\d+[a-z]?)/i);
  if (los) return compact(los[1]);
  const plural = text.match(/\b(\d+)\s*lose\b/i);
  if (plural) return `${plural[1]} Lose`;
  return null;
}

function parseEstimatedValue(raw: any, text: string) {
  const direct = n(raw);
  if (direct > 0) return direct;

  const euroPattern = text.match(/\b(\d{1,3}(?:[.\s]\d{3})+|\d{4,9})\s*(?:€|eur|euro)\b/i);
  if (!euroPattern) return 0;
  const cleaned = euroPattern[1].replace(/[.\s]/g, "");
  return n(cleaned);
}

function queryTokens(query: string) {
  return compact(query)
    .toLowerCase()
    .split(" ")
    .map((x) => x.trim())
    .filter((x) => x.length >= 3);
}

function itemText(item: any) {
  return compact(
    [
      item?.title,
      item?.description,
      item?.region,
      item?.buyer,
      item?.buyerName,
      item?.["buyer-name"],
      item?.["place-of-performance"]
    ].join(" ")
  ).toLowerCase();
}

function matchesQuery(item: any, query: string) {
  const tokens = queryTokens(query);
  if (!tokens.length) return true;
  const text = itemText(item);
  const matched = tokens.filter((t) => text.includes(t)).length;
  const threshold = Math.min(2, tokens.length);
  return matched >= threshold;
}

function inferSourceStatus(result: SourceRunResult["status"]) {
  if (result === "error") return "error";
  if (result === "warning") return "attention";
  return "done";
}

function toTedNoticeUrl(row: any) {
  const publicationNumber = compact(row?.["publication-number"] || row?.publicationNumber);
  if (!publicationNumber) return null;
  return `https://ted.europa.eu/en/notice/-/detail/${encodeURIComponent(publicationNumber)}`;
}

function buildHitFromItem(sourceId: string, item: any, queryUsed: string | null) {
  const sourceName = SOURCE_NAMES[sourceId] || sourceId;
  const title = compact(item?.title || item?.["notice-title"] || "Unbenannter Treffer");
  const description = compact(item?.description || "");
  const regionRaw = compact(item?.region || item?.["place-of-performance"] || "");
  const regionNormalized = normalizeRegionLabel(regionRaw || title || description);
  const tradeRaw = compact(item?.trade || "");
  const tradeNormalized = classifyTrade({ trade: tradeRaw, title, description });
  const buyer = compact(item?.buyer || item?.buyerName || item?.["buyer-name"] || "");
  const dueDate = normalizeDueDate(item?.dueDate || item?.deadline || item?.["deadline-receipt-tender-date"]);
  const durationMonths = extractDurationMonths(
    `${title} ${description}`,
    item?.durationMonths
  );
  const estimatedValue = parseEstimatedValue(
    item?.estimatedValue || item?.["estimated-value"],
    `${title} ${description}`
  );
  const lotInfo = extractLotInfo(`${title} ${description}`);

  const rawUrl =
    item?.detailUrl ||
    item?.noticeUrl ||
    item?.externalUrl ||
    item?.link ||
    item?.url ||
    (sourceId === "src_ted" ? toTedNoticeUrl(item) : null);

  const link = strictDirectLink({
    ...item,
    detailUrl: rawUrl,
    url: rawUrl,
    link: rawUrl,
    noticeUrl: rawUrl
  });

  const calcMode = detectCalcMode({ title, aiReason: description });
  const idSeed = `${sourceId}::${title}::${rawUrl || ""}::${dueDate || ""}`;

  return toPlain({
    id: `hit_${hashId(idSeed)}`,
    sourceId,
    sourceName,
    title,
    description,
    region: regionNormalized,
    regionRaw,
    regionNormalized,
    trade: tradeNormalized,
    tradeRaw: tradeRaw || tradeNormalized,
    tradeNormalized,
    buyer: buyer || null,
    dueDate,
    durationMonths,
    estimatedValue,
    lotInfo,
    calcMode,
    dataMode: "live",
    queryUsed: queryUsed || null,
    discoveryMode: "search_query",
    directLinkValid: link.valid,
    directLinkReason: link.reason,
    linkStatus: link.status,
    linkLabel: link.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
    externalResolvedUrl: link.valid ? link.url : null,
    url: rawUrl || null,
    sourceQuality: link.valid ? "mittel" : "niedrig",
    sourceQualityReasons: [
      ...(dueDate ? [] : ["Frist fehlt"]),
      ...(estimatedValue > 0 ? [] : ["Volumen fehlt"]),
      ...(calcMode !== "unklar" ? [] : ["Kalkulationsmodus unklar"]),
      ...(link.valid ? [] : ["Direktlink unzureichend"])
    ],
    operationallyUsable: link.valid,
    aiEligible: false,
    aiBlockedReason: link.valid ? "noch nicht bewertet" : "Kein valider Direktlink",
    addedSinceLastFetch: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
}

function mergeHits(existingHits: any[], incoming: any[]) {
  const map = new Map<string, any>();
  for (const hit of existingHits) {
    map.set(fingerprint(hit), hit);
  }

  let inserted = 0;
  let updated = 0;
  let duplicates = 0;
  let usableHits = 0;
  let invalidDirectLinks = 0;

  for (const hit of incoming) {
    if (hit.directLinkValid) usableHits += 1;
    else invalidDirectLinks += 1;

    const key = fingerprint(hit);
    const prev = map.get(key);
    if (!prev) {
      inserted += 1;
      map.set(key, hit);
      continue;
    }

    duplicates += 1;
    updated += 1;
    map.set(key, {
      ...prev,
      ...hit,
      id: prev.id || hit.id,
      createdAt: prev.createdAt || hit.createdAt,
      addedSinceLastFetch: false,
      updatedAt: nowIso()
    });
  }

  return {
    rows: [...map.values()],
    inserted,
    updated,
    duplicates,
    usableHits,
    invalidDirectLinks
  };
}

async function fetchItems(sourceId: string, queries: string[]) {
  if (sourceId === "src_service_bund") {
    const rss = await fetchServiceBundRss();
    return { supported: true, rows: rss, note: "RSS-Abruf service.bund erfolgreich." };
  }

  if (sourceId === "src_ted") {
    const ted = await fetchTedNotices(queries);
    const rows = Array.isArray(ted?.notices) ? ted.notices : Array.isArray(ted?.results) ? ted.results : [];
    return { supported: true, rows, note: "TED-Abruf erfolgreich." };
  }

  if (sourceId === "src_berlin") {
    const berlin = await fetchBerlinBekanntmachungenRss();
    return { supported: true, rows: berlin, note: "Berlin Bekanntmachungen RSS erfolgreich." };
  }

  return {
    supported: false,
    rows: [],
    note: "Für diese Quelle ist aktuell kein belastbarer Live-Connector aktiv."
  };
}

async function updateSourceRows(sourceId: string, patch: Record<string, any>) {
  const db = await readStore();
  const sourceRegistry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const sourceStats = Array.isArray(db.sourceStats) ? db.sourceStats : [];

  const nextRegistry = sourceRegistry.map((x: any) =>
    x.id === sourceId ? { ...x, ...patch, updatedAt: nowIso() } : x
  );

  const statIdx = sourceStats.findIndex((x: any) => x.id === sourceId || x.sourceId === sourceId);
  const statPatch = {
    id: sourceId,
    sourceId,
    lastFetchAt: patch.lastRunAt || nowIso(),
    tendersSinceLastFetch: n(patch.lastRunCount),
    lastRunOk: patch.lastRunOk !== false,
    errorCountLastRun: patch.lastRunOk === false ? 1 : 0,
    duplicateCountLastRun: n(patch.lastRunDuplicateCount),
    usableHitsLastRun: n(patch.lastUsableCount),
    invalidLinksLastRun: n(patch.lastInvalidLinkCount),
    lastQueryStatus: patch.lastQueryStatus || "unknown",
    updatedAt: nowIso()
  };

  const nextStats =
    statIdx >= 0
      ? sourceStats.map((x: any, i: number) => (i === statIdx ? { ...x, ...statPatch } : x))
      : [...sourceStats, statPatch];

  await replaceCollection("sourceRegistry", nextRegistry);
  await replaceCollection("sourceStats", nextStats);
}

export async function refreshSource(sourceId: string): Promise<SourceRunResult> {
  await ensureSourceRegistryDefaults();
  await ensureQueryConfig();

  const startedAt = nowIso();
  const sourceName = SOURCE_NAMES[sourceId] || sourceId;

  await updateSourceRows(sourceId, {
    status: "running",
    lastError: null,
    lastRunStartedAt: startedAt
  });

  try {
    const db = await readStore();
    const allQueries = await listQueryConfig();
    const activeQueries = allQueries.filter((x: any) => x.active !== false && x.sourceId === sourceId);
    const queryStrings = [...new Set(activeQueries.map((x: any) => compact(x.query)).filter(Boolean))];

    const fetchResult = await fetchItems(sourceId, queryStrings);
    const rawItems = Array.isArray(fetchResult.rows) ? fetchResult.rows : [];

    const queryResults = queryStrings.map((query) => {
      const matched = rawItems.filter((item: any) => matchesQuery(item, query));
      const usable = matched.filter((row: any) => strictDirectLink(row).valid).length;
      return {
        query,
        status: !fetchResult.supported ? "not_supported" : matched.length > 0 ? "ok" : "no_results",
        hits: matched.length,
        usableHits: usable,
        invalidDirectLinks: matched.length - usable
      };
    });

    const matchedItems =
      queryStrings.length === 0
        ? rawItems.map((item: any) => ({ item, queryUsed: null }))
        : rawItems
            .map((item: any) => {
              const firstMatch = queryStrings.find((query) => matchesQuery(item, query)) || null;
              return firstMatch ? { item, queryUsed: firstMatch } : null;
            })
            .filter(Boolean) as { item: any; queryUsed: string | null }[];

    const incomingHits = matchedItems.map((entry) => buildHitFromItem(sourceId, entry.item, entry.queryUsed));

    const existingHits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
    const scopedExisting = existingHits.map((x: any) =>
      x.sourceId === sourceId ? { ...x, addedSinceLastFetch: false } : x
    );

    const merged = mergeHits(scopedExisting, incomingHits);
    await replaceCollection("sourceHits", merged.rows);

    const status: SourceRunResult["status"] =
      !fetchResult.supported ? "warning" :
      incomingHits.length === 0 ? "warning" :
      "done";

    const finishedAt = nowIso();
    const result: SourceRunResult = {
      ok: status === "done" || status === "warning",
      sourceId,
      sourceName,
      startedAt,
      finishedAt,
      status,
      note: fetchResult.note,
      queryCount: queryStrings.length,
      rawHits: rawItems.length,
      matchedHits: incomingHits.length,
      inserted: merged.inserted,
      updated: merged.updated,
      duplicates: merged.duplicates,
      usableHits: merged.usableHits,
      invalidDirectLinks: merged.invalidDirectLinks,
      queryResults: queryResults.length
        ? queryResults
        : [
            {
              query: null,
              status: fetchResult.supported ? "no_query_config" : "not_supported",
              hits: incomingHits.length,
              usableHits: merged.usableHits,
              invalidDirectLinks: merged.invalidDirectLinks
            }
          ]
    };

    await updateSourceRows(sourceId, {
      status: inferSourceStatus(result.status),
      lastRunAt: finishedAt,
      lastRunOk: result.status !== "error",
      lastRunCount: result.matchedHits,
      lastRunDuplicateCount: result.duplicates,
      lastUsableCount: result.usableHits,
      lastInvalidLinkCount: result.invalidDirectLinks,
      lastQuery: queryStrings.join(" | "),
      lastQueryStatus: result.queryResults.every((x: any) => x.status === "ok")
        ? "ok"
        : result.queryResults.some((x: any) => x.status === "ok")
          ? "partial"
          : result.queryResults[0]?.status || "no_results",
      lastResultStatus: result.status,
      lastResultNote: result.note
    });

    await appendQueryRun({
      mode: "source_refresh",
      sourceId,
      sourceName,
      queryCount: result.queryCount,
      inserted: result.inserted,
      duplicates: result.duplicates,
      usableHits: result.usableHits,
      invalidDirectLinks: result.invalidDirectLinks,
      status: result.status,
      results: result.queryResults
    });

    await appendAuditLog({
      action: "source.refresh",
      entityType: "source",
      entityId: sourceId,
      details: {
        status: result.status,
        queryCount: result.queryCount,
        matchedHits: result.matchedHits,
        usableHits: result.usableHits,
        invalidDirectLinks: result.invalidDirectLinks
      }
    });

    return toPlain(result);
  } catch (error: any) {
    const finishedAt = nowIso();
    const message = error?.message || "source_refresh_failed";

    await updateSourceRows(sourceId, {
      status: "error",
      lastRunAt: finishedAt,
      lastRunOk: false,
      lastError: message,
      lastResultStatus: "error",
      lastResultNote: message
    });

    await appendQueryRun({
      mode: "source_refresh",
      sourceId,
      sourceName,
      queryCount: 0,
      inserted: 0,
      duplicates: 0,
      usableHits: 0,
      invalidDirectLinks: 0,
      status: "error",
      results: [],
      error: message
    });

    await appendAuditLog({
      action: "source.refresh.error",
      entityType: "source",
      entityId: sourceId,
      details: { error: message }
    });

    return toPlain({
      ok: false,
      sourceId,
      sourceName,
      startedAt,
      finishedAt,
      status: "error",
      note: message,
      queryCount: 0,
      rawHits: 0,
      matchedHits: 0,
      inserted: 0,
      updated: 0,
      duplicates: 0,
      usableHits: 0,
      invalidDirectLinks: 0,
      queryResults: []
    });
  }
}

export async function refreshAllSources() {
  await ensureSourceRegistryDefaults();
  const db = await readStore();
  const sourceRegistry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const activeSources = sourceRegistry.filter((x: any) => x.active !== false);

  const results: SourceRunResult[] = [];
  for (const src of activeSources) {
    const run = await refreshSource(String(src.id || ""));
    results.push(run);
  }

  const summary = {
    sourceCount: activeSources.length,
    done: results.filter((x) => x.status === "done").length,
    warning: results.filter((x) => x.status === "warning").length,
    error: results.filter((x) => x.status === "error").length,
    inserted: results.reduce((sum, x) => sum + n(x.inserted), 0),
    usableHits: results.reduce((sum, x) => sum + n(x.usableHits), 0),
    invalidDirectLinks: results.reduce((sum, x) => sum + n(x.invalidDirectLinks), 0)
  };

  return toPlain({
    ok: summary.error === 0,
    startedAt: results[0]?.startedAt || nowIso(),
    finishedAt: nowIso(),
    results,
    summary
  });
}
