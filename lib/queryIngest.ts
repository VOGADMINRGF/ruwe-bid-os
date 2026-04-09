import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";

function nextId(prefix = "qhit") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function inferTrade(query: string) {
  const q = String(query || "").toLowerCase();
  if (q.includes("winterdienst")) return "Winterdienst";
  if (q.includes("glasreinigung")) return "Glasreinigung";
  if (q.includes("reinigung")) return "Reinigung";
  if (q.includes("hausmeister")) return "Hausmeister";
  if (q.includes("sicherheit")) return "Sicherheit";
  if (q.includes("grünpflege") || q.includes("gruenpflege")) return "Grünpflege";
  return "Sonstiges";
}

function inferRegion(query: string) {
  const parts = String(query || "").split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

export async function ingestQueryResult(queryRow: any) {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  const trade = inferTrade(queryRow.query);
  const region = inferRegion(queryRow.query);

  const fakeDetailUrl =
    queryRow.sourceId === "src_service_bund"
      ? `https://www.service.bund.de/IMPORTE/Ausschreibungen/demo/${encodeURIComponent(queryRow.query)}.html`
      : null;

  const linkCheck = strictDirectLink({ detailUrl: fakeDetailUrl });

  const row = {
    id: nextId(),
    sourceId: queryRow.sourceId,
    sourceName: queryRow.sourceId,
    title: `${trade} ${region || "Allgemein"} – Query-Treffer`,
    region: region || "Unbekannt",
    trade,
    estimatedValue: 0,
    durationMonths: 12,
    discoveryMode: "search_query",
    queryUsed: queryRow.query,
    detailUrl: fakeDetailUrl,
    directLinkValid: linkCheck.valid,
    directLinkReason: linkCheck.reason,
    externalResolvedUrl: linkCheck.valid ? linkCheck.url : null,
    operationallyUsable: linkCheck.valid,
    aiEligible: false,
    aiBlockedReason: linkCheck.valid ? null : "Kein valider Direktlink",
    createdAt: new Date().toISOString()
  };

  const duplicate = hits.find((x: any) =>
    String(x.title || "") === String(row.title || "") &&
    String(x.sourceId || "") === String(row.sourceId || "") &&
    String(x.queryUsed || "") === String(row.queryUsed || "")
  );

  if (duplicate) {
    return { inserted: false, duplicate: true, row: duplicate };
  }

  await replaceCollection("sourceHits", [...hits, row]);
  return { inserted: true, duplicate: false, row };
}

export async function manualImportUrl(url: string, sourceId = "manual") {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  const row = {
    id: nextId("manual"),
    sourceId,
    sourceName: sourceId,
    title: `Manuell importierter Treffer`,
    region: "Unbekannt",
    trade: "Sonstiges",
    estimatedValue: 0,
    durationMonths: 12,
    discoveryMode: "manual_import",
    queryUsed: null,
    detailUrl: url,
    directLinkValid: /^https?:\/\//i.test(url),
    directLinkReason: /^https?:\/\//i.test(url) ? "Manueller Direktlink gesetzt." : "Ungültige URL",
    externalResolvedUrl: /^https?:\/\//i.test(url) ? url : null,
    operationallyUsable: /^https?:\/\//i.test(url),
    aiEligible: false,
    aiBlockedReason: "Noch nicht angereichert",
    createdAt: new Date().toISOString()
  };

  await replaceCollection("sourceHits", [...hits, row]);
  return row;
}
