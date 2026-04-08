import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
  ["/zones", "Zones"],
  ["/buyers", "Buyers"],
  ["/references", "References"],
  ["/config", "Config"],
];

export default function Nav() {
  return (
    <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      {items.map(([href, label]) => (
        <Link key={href} href={href} style={{ color: "white", textDecoration: "none", fontWeight: 700 }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
