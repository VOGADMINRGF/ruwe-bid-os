import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { isAiCandidate } from "@/lib/aiGatekeeper";
import { normalizeRegionFromHit } from "@/lib/regionNormalization";
import { classifyTrade, detectCalcMode } from "@/lib/tradeClassification";

function text(v: any) {
  return String(v || "").toLowerCase();
}

function inferTrade(textValue: string) {
  const t = textValue.toLowerCase();
  if (/(unterhaltsreinigung|glasreinigung|reinigung)/.test(t)) return "Reinigung";
  if (/(hausmeister|objektservice)/.test(t)) return "Hausmeister";
  if (/(sicherheit|objektschutz|bewachung|wachdienst)/.test(t)) return "Sicherheit";
  if (/(winterdienst|schnee|glätte)/.test(t)) return "Winterdienst";
  if (/(grünpflege|gruenpflege|garten|landschaft|baum)/.test(t)) return "Grünpflege";
  return "Sonstiges";
}

export async function rescanSourceHits() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];

  let invalidLinks = 0;
  let aiBlocked = 0;

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const direct = strictDirectLink(hit);
    const inferredTrade =
      hit?.trade && hit.trade !== "Sonstiges"
        ? hit.trade
        : inferTrade(`${hit?.title || ""} ${hit?.description || ""}`);
    const tradeNormalized = classifyTrade({ ...hit, trade: inferredTrade });
    const regionNormalized = normalizeRegionFromHit(hit);
    const calcMode = detectCalcMode({ title: hit?.title, aiReason: hit?.aiReason, aiSummary: hit?.description });

    const gate = isAiCandidate({
      ...hit,
      trade: tradeNormalized,
      directLinkValid: direct.valid,
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid
    });

    if (!direct.valid) invalidLinks += 1;
    if (!gate.allowed) aiBlocked += 1;

    hits[i] = {
      ...hit,
      region: regionNormalized || hit?.region || "Unbekannt",
      regionRaw: String(hit?.regionRaw || hit?.region || ""),
      regionNormalized,
      trade: tradeNormalized,
      tradeRaw: String(hit?.tradeRaw || hit?.trade || inferredTrade),
      tradeNormalized,
      directLinkValid: direct.valid,
      directLinkReason: direct.reason,
      linkStatus: direct.status,
      linkLabel: direct.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid,
      calcMode,
      aiEligible: gate.allowed,
      aiBlockedReason: gate.allowed ? null : gate.reason
    };
  }

  await replaceCollection("sourceHits", hits);

  return {
    total: hits.length,
    invalidLinks,
    aiBlocked
  };
}
