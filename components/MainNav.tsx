"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sanitizeInternalHref } from "@/lib/dashboardRoutes";

const primary = [
  { href: "/", label: "Dashboard" },
  { href: "/source-hits", label: "Treffer" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/dashboard/forecast", label: "Forecast" },
  { href: "/dashboard/deadlines", label: "Fristen" },
  { href: "/sites", label: "Betriebshöfe" }
];

const secondary = [
  { href: "/sources", label: "Quellen" },
  { href: "/dashboard/monitoring", label: "Monitoring" },
  { href: "/dashboard/ops", label: "Ops" },
  { href: "/agents", label: "Agents" },
  { href: "/site-rules", label: "Regeln" },
  { href: "/keywords", label: "Keywords" },
  { href: "/config", label: "Config" }
];

export default function MainNav() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand">
          <span>RUWE</span>
          <span className="brand-accent">Bid OS</span>
        </Link>

        <nav className="nav nav-primary">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={sanitizeInternalHref(item.href, "/")}
              className={`nav-link${active(item.href) ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="nav nav-secondary">
          {secondary.map((item) => (
            <Link
              key={item.href}
              href={sanitizeInternalHref(item.href, "/")}
              className={`nav-link subtle${active(item.href) ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
