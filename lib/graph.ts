export function buildGraphNodesFromDb(db: any) {
  const nodes: any[] = [];

  for (const s of db.sites || []) nodes.push({ type: "site", refId: s.id, label: s.name });
  for (const s of db.serviceAreas || []) nodes.push({ type: "service_area", refId: s.id, label: s.name });
  for (const t of db.tenders || []) nodes.push({ type: "tender", refId: t.id, label: t.title });
  for (const b of db.buyers || []) nodes.push({ type: "buyer", refId: b.id, label: b.name });
  for (const a of db.agents || []) nodes.push({ type: "agent", refId: a.id, label: a.name });
  for (const r of db.references || []) nodes.push({ type: "reference", refId: r.id, label: r.title });

  return nodes;
}

export function buildGraphEdgesFromDb(db: any) {
  const edges: any[] = [];

  for (const area of db.serviceAreas || []) {
    edges.push({
      type: "SERVICE_AREA_OF",
      fromType: "service_area",
      fromRefId: area.id,
      toType: "site",
      toRefId: area.siteId
    });
  }

  for (const rule of db.siteTradeRules || []) {
    edges.push({
      type: "SITE_RULE_OF",
      fromType: "site_rule",
      fromRefId: rule.id,
      toType: "site",
      toRefId: rule.siteId
    });
  }

  for (const tender of db.tenders || []) {
    if (tender.matchedSiteId) {
      edges.push({
        type: "MATCHED_SITE",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "site",
        toRefId: tender.matchedSiteId
      });
    }
    if (tender.buyerId) {
      edges.push({
        type: "HAS_BUYER",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "buyer",
        toRefId: tender.buyerId
      });
    }
    if (tender.ownerId) {
      edges.push({
        type: "HANDLED_BY",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "agent",
        toRefId: tender.ownerId
      });
    }
  }

  return edges;
}
