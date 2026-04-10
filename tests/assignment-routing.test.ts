import test from "node:test";
import assert from "node:assert/strict";
import { assignOpportunity } from "../lib/assignmentEngine";

test("assignOpportunity maps region/trade and support owner", () => {
  const assigned = assignOpportunity({
    region: "Berlin",
    trade: "Reinigung",
    calcMode: "unklar",
    estimatedValue: 0,
    directLinkValid: false
  });

  assert.equal(assigned.ownerId, "coord_berlin");
  assert.equal(assigned.supportOwnerId, "assist_docs");
});

test("assignOpportunity avoids single owner fallback", () => {
  const a = assignOpportunity({ region: "Sonstige", trade: "Sonstiges", calcMode: "Pauschale", estimatedValue: 1000, directLinkValid: true });
  const b = assignOpportunity({ region: "Online", trade: "Winterdienst", calcMode: "Stunden", estimatedValue: 1000, directLinkValid: true });
  assert.notEqual(a.ownerId, "");
  assert.notEqual(b.ownerId, "");
});

