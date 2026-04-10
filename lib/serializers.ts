export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function safeHref(value: any, fallback = "/source-hits"): string {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}
