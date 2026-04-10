import { fetchServiceBundRss } from "@/lib/connectors/serviceBund";
import { fetchTedNotices } from "@/lib/connectors/ted";
import { fetchBerlinBekanntmachungenRss } from "@/lib/connectors/berlin";
import { normalizeRegionLabel } from "@/lib/regionNormalization";
import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { classifyTrade, detectCalcMode } from "@/lib/tradeClassification";

function nextId(prefix = "qhit") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function n(v: unknown) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function compact(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseDate(raw: unknown) {
  const text = compact(raw);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const de = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (de) {
    const dd = de[1].padStart(2, "0");
    const mm = de[2].padStart(2, "0");
    const yyyy = de[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return null;
}

function queryTokens(query: string) {
  return compact(query)
    .toLowerCase()
    .split(" ")
    .map((x) => x.trim())
    .filter((x) => x.length >= 3);
}

function textForMatch(item: Record<string, unknown>) {
  return compact(
    [
      item?.title,
      item?.description,
      item?.region,
      item?.["place-of-performance"],
      item?.["buyer-name"]
    ].join(" ")
  ).toLowerCase();
}

function matchesQuery(item: Record<string, unknown>, query: string) {
  const tokens = queryTokens(query);
  if (!tokens.length) return true;
  const text = textForMatch(item);
  const matched = tokens.filter((token) => text.includes(token)).length;
  return matched >= Math.min(2, tokens.length);
}

function tedNoticeUrl(item: Record<string, unknown>) {
  const number = compact(item?.["publication-number"]);
  if (!number) return null;
  return `https://ted.europa.eu/en/notice/-/detail/${encodeURIComponent(number)}`;
}

function buildHit(sourceId: string, query: string, item: Record<string, unknown>) {
  const title = compact(item?.title || item?.["notice-title"] || "Unbenannter Treffer");
  const description = compact(item?.description || "");
  const regionRaw = compact(item?.region || item?.["place-of-performance"] || "");
  const regionNormalized = normalizeRegionLabel(regionRaw || title || description);
  const tradeNormalized = classifyTrade({ title, description, trade: item?.trade || "" });
  const dueDate = parseDate(item?.dueDate || item?.["deadline-receipt-tender-date"] || item?.pubDate);
  const rawUrl = compact(item?.link || item?.detailUrl || item?.url || tedNoticeUrl(item));
  const link = strictDirectLink({
    ...item,
    detailUrl: rawUrl,
    noticeUrl: rawUrl,
    url: rawUrl,
    link: rawUrl
  });
  const estimatedValue = n(item?.estimatedValue || item?.["estimated-value"]);
  const calcMode = detectCalcMode({ title, aiSummary: description, aiReason: description });

  return {
    id: nextId(),
    sourceId,
    sourceName: sourceId,
    title,
    description,
    region: regionNormalized,
    regionRaw,
    regionNormalized,
    trade: tradeNormalized,
    tradeRaw: compact(item?.trade || tradeNormalized),
    tradeNormalized,
    buyer: compact(item?.buyer || item?.["buyer-name"]) || null,
    estimatedValue,
    dueDate,
    durationMonths: 0,
    calcMode,
    discoveryMode: "search_query",
    queryUsed: query,
    detailUrl: rawUrl || null,
    directLinkValid: link.valid,
    directLinkReason: link.reason,
    linkStatus: link.status,
    linkLabel: link.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
    externalResolvedUrl: link.valid ? link.url : null,
    operationallyUsable: link.valid,
    aiEligible: false,
    aiBlockedReason: link.valid ? "Noch nicht angereichert" : "Kein valider Direktlink",
    sourceQuality: link.valid ? "mittel" : "niedrig",
    sourceQualityReasons: [
      ...(link.valid ? [] : ["Direktlink unzureichend"]),
      ...(dueDate ? [] : ["Frist fehlt"]),
      ...(estimatedValue > 0 ? [] : ["Volumen fehlt"])
    ],
    dataMode: "live",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function loadSourceItems(sourceId: string, query: string) {
  if (sourceId === "src_service_bund") {
    const rows = await fetchServiceBundRss();
    return { supported: true, rows };
  }
  if (sourceId === "src_ted") {
    const ted = await fetchTedNotices([query]);
    const rows = Array.isArray(ted?.notices)
      ? ted.notices
      : Array.isArray(ted?.results)
      ? ted.results
      : [];
    return { supported: true, rows };
  }
  if (sourceId === "src_berlin") {
    const rows = await fetchBerlinBekanntmachungenRss();
    return { supported: true, rows };
  }
  return { supported: false, rows: [] };
}

function isDuplicate(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
  const sameSource = String(existing?.sourceId || "") === String(incoming?.sourceId || "");
  const sameTitle = compact(existing?.title).toLowerCase() === compact(incoming?.title).toLowerCase();
  const existingLink = compact(existing?.externalResolvedUrl || existing?.detailUrl || existing?.url);
  const incomingLink = compact(incoming?.externalResolvedUrl || incoming?.detailUrl || incoming?.url);
  const sameLink = existingLink === incomingLink;
  const sameQuery = compact(existing?.queryUsed) === compact(incoming?.queryUsed);
  return sameSource && ((sameTitle && sameQuery) || (sameLink && incomingLink.length > 8));
}

export async function ingestQueryResult(queryRow: { sourceId: string; query: string }) {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  const sourceId = String(queryRow.sourceId || "");
  const query = compact(queryRow.query);

  const loaded = await loadSourceItems(sourceId, query);
  if (!loaded.supported) {
    return {
      inserted: false,
      duplicate: false,
      row: null,
      status: "unsupported",
      reason: "Für diese Quelle ist aktuell kein belastbarer Query-Connector aktiv."
    };
  }

  const matched = loaded.rows.filter((item: Record<string, unknown>) => matchesQuery(item, query));
  if (!matched.length) {
    return {
      inserted: false,
      duplicate: false,
      row: null,
      status: "no_match",
      reason: "Keine Treffer für Query."
    };
  }

  const preferred = matched.find((x: Record<string, unknown>) => strictDirectLink(x).valid) || matched[0];
  const row = buildHit(sourceId, query, preferred);

  const duplicate = hits.find((x: Record<string, unknown>) => isDuplicate(x, row));
  if (duplicate) {
    return {
      inserted: false,
      duplicate: true,
      row: duplicate,
      status: "duplicate",
      reason: "Treffer bereits vorhanden."
    };
  }

  await replaceCollection("sourceHits", [...hits, row]);
  return {
    inserted: true,
    duplicate: false,
    row,
    status: row.directLinkValid ? "ok" : "invalid_link",
    reason: row.directLinkValid ? "Treffer gespeichert." : "Treffer gespeichert, aber Direktlink nicht belastbar."
  };
}

export async function manualImportUrl(url: string, sourceId = "manual") {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const link = strictDirectLink({ detailUrl: url });

  const row = {
    id: nextId("manual"),
    sourceId,
    sourceName: sourceId,
    title: "Manuell importierter Treffer",
    region: "Sonstige",
    regionRaw: "",
    regionNormalized: "Sonstige",
    trade: "Sonstiges",
    tradeRaw: "",
    tradeNormalized: "Sonstiges",
    estimatedValue: 0,
    durationMonths: 0,
    calcMode: "unklar",
    discoveryMode: "manual_import",
    queryUsed: null,
    detailUrl: url,
    directLinkValid: link.valid,
    directLinkReason: link.reason,
    linkStatus: link.status,
    linkLabel: link.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
    externalResolvedUrl: link.valid ? link.url : null,
    operationallyUsable: link.valid,
    aiEligible: false,
    aiBlockedReason: link.valid ? "Noch nicht angereichert" : "Kein valider Direktlink",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await replaceCollection("sourceHits", [...hits, row]);
  return row;
}
