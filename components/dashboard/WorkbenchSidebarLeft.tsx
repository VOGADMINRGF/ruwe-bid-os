import Link from "next/link";
import { buildDashboardHref, sanitizeInternalHref } from "@/lib/dashboardRoutes";

export type SidebarFilters = {
  trades: string[];
  regions: string[];
  decisions: string[];
  sources: string[];
};

export default function WorkbenchSidebarLeft({
  filters,
  current
}: {
  filters: SidebarFilters;
  current: Record<string, string | undefined>;
}) {
  const makeHref = (patch: Record<string, string | undefined>) => {
    const merged = { ...current, ...patch };
    return buildDashboardHref("/", merged);
  };

  const isActive = (key: string, value: string) => {
    if (value === "Alle") return !current[key] || current[key] === "Alle";
    return current[key] === value;
  };

  return (
    <aside className="wb-sidebar wb-sidebar-left">
      <div className="card wb-panel">
        <div className="section-title">Steuerung</div>
        <p className="sub wb-panel-sub">
          Filtere Marktbild, Region und Entscheidung direkt im Dashboard.
        </p>

        <div className="stack wb-filter-stack">
          <div className="label">Geschäftsfelder</div>
          {filters.trades.slice(0, 8).map((x) => (
            <Link
              key={x}
              className={`wb-filter-link${isActive("trade", x) ? " is-active" : ""}`}
              href={sanitizeInternalHref(makeHref({ trade: x }), "/")}
            >
              {x}
            </Link>
          ))}

          <div className="label">Entscheidung</div>
          {filters.decisions.map((x) => (
            <Link
              key={x}
              className={`wb-filter-link${isActive("decision", x) ? " is-active" : ""}`}
              href={sanitizeInternalHref(makeHref({ decision: x }), "/")}
            >
              {x}
            </Link>
          ))}

          <div className="label">Top-Regionen</div>
          {filters.regions.slice(0, 7).map((x) => (
            <Link
              key={x}
              className={`wb-filter-link${isActive("region", x) ? " is-active" : ""}`}
              href={sanitizeInternalHref(makeHref({ region: x }), "/")}
            >
              {x}
            </Link>
          ))}

          <div className="label">Quellen</div>
          {filters.sources.slice(0, 6).map((x) => (
            <Link
              key={x}
              className={`wb-filter-link${isActive("sourceId", x) ? " is-active" : ""}`}
              href={sanitizeInternalHref(makeHref({ sourceId: x }), "/")}
            >
              {x}
            </Link>
          ))}

          <Link className="button-secondary wb-filter-reset" href="/">
            Filter zurücksetzen
          </Link>
        </div>
      </div>
    </aside>
  );
}
