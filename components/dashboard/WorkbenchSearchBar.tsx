import type { SidebarFilters } from "@/components/dashboard/WorkbenchSidebarLeft";

export default function WorkbenchSearchBar({
  search,
  trade,
  region,
  decision,
  sourceId,
  filters
}: {
  search?: string;
  trade?: string;
  region?: string;
  decision?: string;
  sourceId?: string;
  filters: SidebarFilters;
}) {
  return (
    <form method="GET" className="card wb-search-card">
      <div className="grid wb-search-grid">
        <input className="input" name="search" defaultValue={search || ""} placeholder="Suche Titel / Region / Gewerk" />
        <select className="select" name="trade" defaultValue={trade || "Alle"}>
          {filters.trades.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="select" name="region" defaultValue={region || "Alle"}>
          {filters.regions.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="select" name="decision" defaultValue={decision || "Alle"}>
          {filters.decisions.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="select" name="sourceId" defaultValue={sourceId || "Alle"}>
          {filters.sources.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="button" type="submit">Filtern</button>
      </div>
    </form>
  );
}
