import test from "node:test";
import assert from "node:assert/strict";
import { baseStore, withIsolatedStore } from "./helpers/storeHarness";
import { overrideOpportunity } from "../lib/opportunityOverrides";
import { enrichOpportunitiesWithFit } from "../lib/opportunityEnrichment";
import { readStore } from "../lib/storage";

test("override with learn creates learning rule and affects similar opportunities", async () => {
  await withIsolatedStore(
    baseStore({
      opportunities: [
        {
          id: "opp_a",
          title: "Fall A",
          region: "Berlin",
          trade: "Reinigung",
          decision: "No-Bid",
          directLinkValid: true,
          estimatedValue: 120000,
          calcMode: "Stunden",
          fitReasonList: []
        },
        {
          id: "opp_b",
          title: "Fall B",
          region: "Berlin",
          trade: "Reinigung",
          decision: "No-Go",
          directLinkValid: true,
          estimatedValue: 90000,
          calcMode: "Stunden",
          fitReasonList: []
        }
      ],
      siteTradeRules: [{ id: "r1", enabled: true, trade: "Reinigung" }]
    }),
    async () => {
      await overrideOpportunity("opp_a", {
        decision: "Bid",
        reason: "Manuell freigegeben",
        learn: true,
        by: "admin"
      });
      await enrichOpportunitiesWithFit();

      const db = await readStore();
      const rules = Array.isArray((db as any).learningRules) ? (db as any).learningRules : [];
      assert.equal(rules.length, 1);
      assert.equal(rules[0].action, "promote_bid");

      const oppB = (db.opportunities || []).find((x: any) => x.id === "opp_b");
      assert.ok(oppB);
      assert.equal(oppB.decision, "Prüfen");
    }
  );
});

