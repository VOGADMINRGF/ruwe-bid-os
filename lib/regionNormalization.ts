import { toPlain } from "@/lib/serializers";

function txt(v: any) {
  return String(v || "").trim();
}

export function normalizeRegionLabel(input: any) {
  const s = txt(input).toLowerCase();

  if (!s) return "Sonstige";

  if (s.includes("berlin")) return "Berlin";
  if (s.includes("magdeburg")) return "Magdeburg";
  if (s.includes("schkeuditz") || s.includes("leipzig")) return "Leipzig / Schkeuditz";
  if (s.includes("zeitz")) return "Zeitz";
  if (s.includes("potsdam") || s.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (s.includes("brandenburg")) return "Brandenburg";
  if (s.includes("halle") || s.includes("stendal") || s.includes("bismark") || s.includes("dessau") || s.includes("merseburg")) return "Sachsen-Anhalt";
  if (s.includes("jena") || s.includes("weimar") || s.includes("erfurt") || s.includes("ilm")) return "Thüringen";
  if (s.includes("online")) return "Online";

  return "Sonstige";
}

export function buildRegionCandidates(hit: any) {
  const parts = [
    hit?.region,
    hit?.city,
    hit?.postalCode,
    hit?.title,
    hit?.url
  ].filter(Boolean);

  return toPlain(parts.map((x) => String(x)));
}

export function normalizeRegionFromHit(hit: any) {
  const candidates = buildRegionCandidates(hit);
  for (const c of candidates) {
    const normalized = normalizeRegionLabel(c);
    if (normalized !== "Sonstige") return normalized;
  }
  return "Sonstige";
}
