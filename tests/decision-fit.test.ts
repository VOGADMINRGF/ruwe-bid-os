import test from "node:test";
import assert from "node:assert/strict";
import { buildOpportunityFromHit } from "../lib/opportunitySchema";
import { scoreOpportunityFit } from "../lib/fitScoring";
import { baseStore, withIsolatedStore } from "./helpers/storeHarness";

test("buildOpportunityFromHit creates restrictive decision with readable reason when link invalid", () => {
  const opp = buildOpportunityFromHit({
    id: "hit_1",
    title: "Reinigung Verwaltungsobjekt",
    sourceId: "src_service_bund",
    region: "Berlin",
    trade: "Reinigung",
    directLinkValid: false,
    estimatedValue: 250000
  });

  assert.equal(opp.decision, "No-Bid");
  assert.ok(String(opp.noBidReason || "").length > 20);
  assert.ok(String(opp.fitReasonShort || "").length > 20);
});

test("scoreOpportunityFit uses learning rules signal", async () => {
  await withIsolatedStore(
    baseStore({
      siteTradeRules: [{ id: "r1", enabled: true, trade: "Reinigung" }],
      learningRules: [{ id: "lr1", trade: "Reinigung", region: "Berlin", action: "promote_bid", reason: "historisch positiv" }]
    }),
    async () => {
      const fit = await scoreOpportunityFit({
        region: "Berlin",
        trade: "Reinigung",
        decision: "Prüfen",
        directLinkValid: true,
        estimatedValue: 100000,
        calcMode: "Stunden"
      });
      assert.ok(fit.score >= 70);
      assert.ok(fit.detailedReasons.some((x: string) => x.toLowerCase().includes("lernregel")));
    }
  );
});

