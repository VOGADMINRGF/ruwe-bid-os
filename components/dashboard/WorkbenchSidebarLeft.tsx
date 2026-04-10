import Link from "next/link";

export default function WorkbenchSidebarLeft({
  filters,
  current
}: {
  filters: any;
  current: Record<string, string | undefined>;
}) {
  const makeHref = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { ...current, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "Alle") params.set(k, v);
    }
    return `/?${params.toString()}`;
  };

  return (
    <aside className="wb-sidebar">
      <div className="card">
        <div className="section-title">Schnellfilter</div>

        <div className="stack" style={{ gap: 8, marginTop: 14 }}>
          <div className="label">Geschäftsfelder</div>
          {filters.trades.slice(0, 7).map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ trade: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Entscheidung</div>
          {["Bid", "Prüfen", "No-Bid"].map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ decision: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Top-Regionen</div>
          {filters.regions.slice(0, 6).map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ region: x })}>{x}</Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
