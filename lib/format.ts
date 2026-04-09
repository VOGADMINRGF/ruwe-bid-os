export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

export function dataModeLabel(mode?: string) {
  if (mode === "live") return "Live";
  if (mode === "smoke") return "Smoke";
  return "Demo";
}

export function dataModeBadgeClass(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  if (mode === "smoke") return "badge badge-gemischt";
  return "badge badge-kritisch";
}
