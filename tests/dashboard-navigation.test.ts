import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildDashboardKpiCards } from "../lib/dashboardKpiModel";
import {
  getRouteBase,
  isKnownRouteBase,
  sanitizeInternalHref
} from "../lib/dashboardRoutes";
import KpiMetricCard from "../components/dashboard/KpiMetricCard";
import WorkbenchSidebarRight from "../components/dashboard/WorkbenchSidebarRight";

test("dashboard KPI href targets map to known existing route bases", () => {
  const cards = buildDashboardKpiCards({
    totalVolume: 1000000,
    recommendedVolume: 250000,
    noBidVolume: 50000,
    hitCount: 42,
    bidCount: 9,
    reviewCount: 7,
    noBidCount: 4,
    siteCount: 6,
    ruleCount: 12,
    due7: 3,
    due14: 6,
    openVariables: 5
  });

  for (const card of cards) {
    const base = getRouteBase(card.href);
    assert.equal(isKnownRouteBase(base), true, `unknown route base in KPI card: ${card.href}`);
    assert.equal(card.href.startsWith("/ops"), false, "legacy /ops dead-link must not be used");
    assert.equal(card.href.startsWith("/fristen"), false, "legacy /fristen dead-link must not be used");
    assert.equal(card.href.startsWith("/treffer"), false, "legacy /treffer dead-link must not be used");
  }
});

test("KPI card renders as fully clickable anchor with safe href", () => {
  const html = renderToStaticMarkup(
    React.createElement(KpiMetricCard, {
      label: "Treffer gesamt",
      value: 11,
      subtext: "alle Quellen",
      href: "/source-hits",
      priority: "default"
    })
  );

  assert.match(html, /^<a /);
  assert.match(html, /href="\/source-hits"/);
});

test("dashboard right panel renders key management sections and fallback links", () => {
  const html = renderToStaticMarkup(
    React.createElement(WorkbenchSidebarRight, {
      highlights: [],
      attention: [],
      priorities: []
    })
  );

  assert.match(html, /Highlights/);
  assert.match(html, /Handlungsdruck/);
  assert.match(html, /Prioritäten/);
  assert.equal(sanitizeInternalHref("/does-not-exist", "/source-hits"), "/source-hits");
});
