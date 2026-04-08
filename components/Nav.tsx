"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/tenders", label: "Tenders" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/agents", label: "Agents" },
  { href: "/zones", label: "Zones" },
  { href: "/buyers", label: "Buyers" },
  { href: "/references", label: "References" },
  { href: "/config", label: "Config" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-black text-white px-6 py-4 flex gap-6">
      <div className="font-bold text-orange-500 text-xl">RUWE Bid OS</div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "text-orange-500" : "hover:text-orange-300"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
