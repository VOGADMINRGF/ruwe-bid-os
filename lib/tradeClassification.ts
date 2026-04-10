import { toPlain } from "@/lib/serializers";

export const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst",
  "Sonstiges"
];

function s(v: any) {
  return String(v || "").toLowerCase();
}

export function classifyTrade(hit: any) {
  const text = [
    hit?.trade,
    hit?.title,
    hit?.aiSummary,
    hit?.aiReason,
    hit?.aiPrimaryReason
  ].map(s).join(" ");

  if (text.includes("glas")) return "Glasreinigung";
  if (text.includes("winter") || text.includes("schnee") || text.includes("glätte")) return "Winterdienst";
  if (text.includes("hausmeister") || text.includes("hauswart") || text.includes("objektservice")) return "Hausmeister";
  if (text.includes("sicherheit") || text.includes("objektschutz") || text.includes("wachdienst") || text.includes("wachschutz")) return "Sicherheit";
  if (text.includes("grün") || text.includes("garten") || text.includes("landschaft") || text.includes("baumpflege")) return "Grünpflege";
  if (text.includes("reinigung") || text.includes("unterhaltsreinigung") || text.includes("gebäudereinigung")) return "Reinigung";

  return "Sonstiges";
}

export function detectCalcMode(hit: any) {
  const text = [
    hit?.title,
    hit?.aiSummary,
    hit?.aiReason,
    hit?.aiPrimaryReason
  ].map(s).join(" ");

  if (/\b(stunden|std|stundenlohn|stundensatz)\b/.test(text)) return "Stunden";
  if (/\b(qm|m²|quadratmeter|fläche)\b/.test(text)) return "Fläche";
  if (/\b(täglich|wöchentlich|monatlich|turnus|intervall)\b/.test(text)) return "Turnus";
  if (/\b(pauschal|pauschale|festpreis)\b/.test(text)) return "Pauschale";
  if (/\b(los|lose)\b/.test(text) && /\b(stunden|qm|fläche|turnus)\b/.test(text)) return "Mischmodell";

  return "unklar";
}

export function classifyOpportunity(hit: any) {
  return toPlain({
    trade: classifyTrade(hit),
    calcMode: detectCalcMode(hit)
  });
}
