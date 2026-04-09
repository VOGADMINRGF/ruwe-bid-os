export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

export function modeLabel(mode?: string) {
  if (mode === "live") return "Live";
  return "Teststand";
}

export function modeBadgeClass(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  return "badge badge-gemischt";
}

/* rückwärtskompatibel */
export const dataModeLabel = modeLabel;
export const dataModeBadgeClass = modeBadgeClass;
