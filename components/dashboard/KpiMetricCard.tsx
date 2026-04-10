import Link from "next/link";
import { sanitizeInternalHref } from "@/lib/dashboardRoutes";

export type KpiPriority = "default" | "accent" | "primary" | "warning";

type KpiMetricCardProps = {
  icon?: string;
  label: string;
  value: string | number;
  subtext?: string;
  href?: string;
  priority?: KpiPriority;
};

export default function KpiMetricCard({
  icon,
  label,
  value,
  subtext,
  href,
  priority = "default"
}: KpiMetricCardProps) {
  const safeHref = sanitizeInternalHref(href, "/");

  return (
    <Link href={safeHref} className={`kpi-card kpi-${priority}`} aria-label={`${label} öffnen`}>
      <div className="kpi-card-topline">
        {icon ? <span className="kpi-icon">{icon}</span> : null}
        <span className="label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {subtext ? <div className="metric-sub">{subtext}</div> : null}
    </Link>
  );
}
