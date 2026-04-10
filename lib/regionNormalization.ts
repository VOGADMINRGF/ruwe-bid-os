import { toPlain } from "@/lib/serializers";

function s(v: any) {
  return String(v || "").trim();
}

export function normalizeRegionLabel(input: any) {
  const raw = s(input).toLowerCase();
  if (!raw) return "Sonstige";

  if (raw.includes("berlin")) return "Berlin";
  if (raw.includes("magdeburg")) return "Magdeburg";
  if (raw.includes("schkeuditz") || raw.includes("leipzig")) return "Leipzig / Schkeuditz";
  if (raw.includes("zeitz")) return "Zeitz";
  if (raw.includes("potsdam") || raw.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (raw.includes("brandenburg")) return "Brandenburg";
  if (raw.includes("halle") || raw.includes("stendal") || raw.includes("dessau") || raw.includes("merseburg") || raw.includes("bismark")) return "Sachsen-Anhalt";
  if (raw.includes("jena") || raw.includes("weimar") || raw.includes("erfurt") || raw.includes("ilm")) return "Thüringen";
  if (raw.includes("online")) return "Online";

  return "Sonstige";
}

export function normalizeRegionFromHit(hit: any) {
  const candidates = [
    hit?.region,
    hit?.city,
    hit?.postalCode,
    hit?.title,
    hit?.url
  ].filter(Boolean);

  for (const c of candidates) {
    const n = normalizeRegionLabel(c);
    if (n !== "Sonstige") return n;
  }

  return "Sonstige";
}

export function buildRegionDebug(hit: any) {
  return toPlain([
    String(hit?.region || ""),
    String(hit?.city || ""),
    String(hit?.postalCode || ""),
    String(hit?.title || "")
  ]);
}
