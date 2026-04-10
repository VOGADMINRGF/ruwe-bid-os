import { formatCurrencyCompact } from "@/lib/numberFormat";

export type DashboardKpiData = {
  totalVolume: number;
  recommendedVolume: number;
  noBidVolume: number;
  hitCount: number;
  bidCount: number;
  reviewCount: number;
  noBidCount: number;
  siteCount: number;
  ruleCount: number;
  due7?: number;
  due14?: number;
  openVariables?: number;
};

export type DashboardKpiCard = {
  icon: string;
  label: string;
  value: string | number;
  subtext: string;
  href: string;
  priority: "default" | "accent" | "primary" | "warning";
};

export function buildDashboardKpiCards(kpis: DashboardKpiData): DashboardKpiCard[] {
  const openVariables = kpis.openVariables || 0;
  const due7 = kpis.due7 || 0;
  const due14 = kpis.due14 || 0;
  const openActionCount = (kpis.reviewCount || 0) + openVariables;
  const economicVolume = kpis.recommendedVolume > 0 ? kpis.recommendedVolume : kpis.totalVolume;
  const economicLabel = kpis.recommendedVolume > 0 ? "Empfohlenes Volumen" : "Ausschreibungsvolumen";

  return [
    {
      icon: "!",
      label: "Offene Aufgaben",
      value: openActionCount,
      subtext: `${kpis.reviewCount || 0} Prüfen · ${openVariables} Variablen`,
      href: openVariables > 0 ? "/missing-variables?status=offen" : "/opportunities?decision=Pr%C3%BCfen",
      priority: "primary"
    },
    {
      icon: "€",
      label: economicLabel,
      value: formatCurrencyCompact(economicVolume),
      subtext: `${kpis.bidCount} Bid-Fälle`,
      href: "/opportunities?decision=Bid&sort=volume",
      priority: "primary"
    },
    {
      icon: "#",
      label: "Treffer gesamt",
      value: kpis.hitCount,
      subtext: "alle Quellen",
      href: "/source-hits",
      priority: "default"
    },
    {
      icon: "?",
      label: "Prüfen",
      value: kpis.reviewCount,
      subtext: "manuelle Bewertung",
      href: "/opportunities?decision=Pr%C3%BCfen",
      priority: "accent"
    },
    {
      icon: "x",
      label: "No-Bid / No-Go",
      value: kpis.noBidCount,
      subtext: formatCurrencyCompact(kpis.noBidVolume),
      href: "/opportunities?decision=No-Bid",
      priority: "warning"
    },
    {
      icon: "7",
      label: "Fristen <= 7 Tage",
      value: due7,
      subtext: "zeitkritisch",
      href: "/pipeline?window=7d",
      priority: "warning"
    },
    {
      icon: "14",
      label: "Fristen <= 14 Tage",
      value: due14,
      subtext: "kurzfristig",
      href: "/pipeline?window=14d",
      priority: "accent"
    },
    {
      icon: "S",
      label: "Standorte",
      value: kpis.siteCount,
      subtext: "aktive Betriebshöfe",
      href: "/sites",
      priority: "default"
    },
    {
      icon: "R",
      label: "Regeln",
      value: kpis.ruleCount,
      subtext: "Betriebslogik",
      href: "/site-rules",
      priority: "default"
    }
  ];
}
