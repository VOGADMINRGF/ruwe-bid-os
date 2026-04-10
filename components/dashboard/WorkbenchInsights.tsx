"use client";

import { useState } from "react";
import Link from "next/link";
import { sanitizeHref } from "@/lib/dashboardRoutes";

type InsightRow = {
  id: string;
  title: string;
  region?: string;
  regionNormalized?: string;
  trade?: string;
  durationMonths?: number;
  estimatedValue?: number;
  noBidReason?: string;
  href?: string;
  externalResolvedUrl?: string;
};

export default function WorkbenchInsights({
  focusHits,
  longRuns,
  noBidRows
}: {
  focusHits: InsightRow[];
  longRuns: InsightRow[];
  noBidRows: InsightRow[];
}) {
  const [tab, setTab] = useState<"focus" | "runs" | "nobid">("focus");

  const rows =
    tab === "focus" ? focusHits :
    tab === "runs" ? longRuns :
    noBidRows;

  return (
    <div className="card">
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button className={tab === "focus" ? "button" : "button-secondary"} onClick={() => setTab("focus")} type="button">
          Fokus
        </button>
        <button className={tab === "runs" ? "button" : "button-secondary"} onClick={() => setTab("runs")} type="button">
          Laufzeiten
        </button>
        <button className={tab === "nobid" ? "button" : "button-secondary"} onClick={() => setTab("nobid")} type="button">
          No-Bid
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>{tab === "runs" ? "Laufzeit" : tab === "nobid" ? "Grund" : "Volumen"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3}>Keine Daten für diesen Bereich vorhanden.</td>
              </tr>
            ) : rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <Link
                    className="linkish"
                    href={sanitizeHref(
                      x.href || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`,
                      { fallback: "/source-hits" }
                    )}
                  >
                    {x.title}
                  </Link>
                </td>
                <td>{x.region || "-"}</td>
                <td>
                  {tab === "runs"
                    ? `${x.durationMonths || 0} Mon.`
                    : tab === "nobid"
                    ? x.noBidReason || "-"
                    : x.estimatedValue || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
