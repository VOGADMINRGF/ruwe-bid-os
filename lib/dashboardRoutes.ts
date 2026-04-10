const KNOWN_ROUTE_BASES = [
  "/",
  "/agents",
  "/buyers",
  "/config",
  "/connectors",
  "/cost-models",
  "/dashboard",
  "/dashboard/ai-results",
  "/dashboard/ai-smoke",
  "/dashboard/audit",
  "/dashboard/coverage",
  "/dashboard/go-no-go",
  "/dashboard/live",
  "/dashboard/manual-review",
  "/dashboard/new-hits",
  "/dashboard/prefiltered",
  "/dashboard/smoke",
  "/dashboard/source-tests",
  "/source-hits",
  "/opportunities",
  "/missing-variables",
  "/pipeline",
  "/parameter-memory",
  "/query-center",
  "/query-config",
  "/query-history",
  "/references",
  "/service-areas",
  "/sites",
  "/site-rules",
  "/showcase",
  "/sources",
  "/tenders",
  "/zones",
  "/owner-workload",
  "/dashboard/deadlines",
  "/dashboard/forecast",
  "/dashboard/monitoring",
  "/dashboard/ops",
  "/keywords",
  "/learning-rules",
  "/quellensteuerung",
  "/betriebslogik",
  "/forecast"
] as const;

export type KnownRouteBase = (typeof KNOWN_ROUTE_BASES)[number];

const ROUTE_BASE_SET = new Set<string>(KNOWN_ROUTE_BASES);

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getRouteBase(href: string): string {
  const [path] = href.split(/[?#]/, 1);
  return path || "/";
}

export function isKnownRouteBase(base: string): base is KnownRouteBase {
  return ROUTE_BASE_SET.has(base);
}

export function sanitizeInternalHref(href: string | undefined, fallback: KnownRouteBase = "/"): string {
  if (!href || !href.trim()) return fallback;
  if (!href.startsWith("/")) return fallback;
  const base = getRouteBase(href);
  return isKnownRouteBase(base) ? href : fallback;
}

export function sanitizeHref(
  href: string | undefined,
  options?: { fallback?: KnownRouteBase; allowExternal?: boolean }
): string {
  const fallback = options?.fallback || "/";
  if (!href || !href.trim()) return fallback;
  if (href.startsWith("/")) return sanitizeInternalHref(href, fallback);
  if (options?.allowExternal && isHttpUrl(href)) return href;
  return fallback;
}

export function buildDashboardHref(
  base: KnownRouteBase,
  params: Record<string, string | undefined | null>
): string {
  const search = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const value = raw?.trim();
    if (!value || value === "Alle") continue;
    search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function listKnownRouteBases(): readonly KnownRouteBase[] {
  return KNOWN_ROUTE_BASES;
}
