import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/sites", "Sites"],
  ["/service-areas", "Service Areas"],
  ["/site-rules", "Site Rules"],
  ["/keywords", "Keywords"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
  ["/zones", "Zones"],
  ["/buyers", "Buyers"],
  ["/references", "References"],
  ["/config", "Config"]
] as const;

export default function Nav() {
  return (
    <div className="nav">
      {items.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </div>
  );
}
