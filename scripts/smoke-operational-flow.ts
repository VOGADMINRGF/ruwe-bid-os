import { baseStore, withIsolatedStore } from "../tests/helpers/storeHarness";
import { readStore, replaceCollection } from "../lib/storage";
import { enrichHitsStrictAndLearn } from "../lib/hitEnrichment";
import { rebuildOpportunities } from "../lib/opportunityRebuild";
import { enrichOpportunitiesWithFit } from "../lib/opportunityEnrichment";
import { closeMissingVariableWithParameter } from "../lib/missingVariablesWorkflow";

async function run() {
  await withIsolatedStore(
    baseStore({
      sourceHits: [
        {
          id: "hit_smoke_1",
          sourceId: "src_service_bund",
          sourceName: "service.bund.de",
          title: "Unterhaltsreinigung Verwaltungsgebäude Berlin",
          description: "Leistung nach Stundensatz 42 EUR/h, Laufzeit 24 Monate",
          regionRaw: "Berlin",
          tradeRaw: "",
          directLinkValid: true,
          externalResolvedUrl: "https://www.service.bund.de/impulse/ausschreibung/123",
          estimatedValue: 0,
          durationMonths: 24,
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      parameterMemory: [
        {
          id: "pm_1",
          type: "cost",
          parameterKey: "default_rate",
          region: "Berlin",
          trade: "Reinigung",
          value: 42,
          status: "defined",
          source: "smoke",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      siteTradeRules: [{ id: "rule_1", siteId: "site_1", trade: "Reinigung", enabled: true }]
    }),
    async () => {
      await enrichHitsStrictAndLearn();
      await rebuildOpportunities();
      await enrichOpportunitiesWithFit();

      const db1 = await readStore();
      const firstVariable = (db1.costGaps || [])[0];
      if (firstVariable) {
        await closeMissingVariableWithParameter(firstVariable.id, "2026-05-15", "defined");
      }

      const db2 = await readStore();
      const result = {
        hits: (db2.sourceHits || []).length,
        opportunities: (db2.opportunities || []).length,
        missingVariables: (db2.costGaps || []).length,
        answeredVariables: (db2.costGaps || []).filter((x: any) => x.status === "beantwortet").length
      };
      await replaceCollection("meta", {
        ...(db2.meta || {}),
        lastSmokeRunAt: new Date().toISOString(),
        lastSmokeSummary: result
      });
      console.log(JSON.stringify({ ok: true, result }, null, 2));
    }
  );
}

run().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});

