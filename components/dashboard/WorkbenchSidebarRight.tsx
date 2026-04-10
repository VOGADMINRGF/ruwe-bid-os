import Link from "next/link";

export default function WorkbenchSidebarRight({ items }: { items: any[] }) {
  return (
    <aside className="wb-sidebar">
      <div className="card">
        <div className="section-title">Highlights</div>
        <div className="stack" style={{ gap: 12, marginTop: 14 }}>
          {items.map((item: any, i: number) => (
            <Link key={i} href={item?.href || "/source-hits"} className="wb-highlight-link">
              <div className="label">{item.label}</div>
              <div>{item.value}</div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
