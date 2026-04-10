import test from "node:test";
import assert from "node:assert/strict";
import { baseStore, withIsolatedStore } from "./helpers/storeHarness";
import { GET } from "../app/api/ops/source-overview/route";

test("api source-overview returns consolidated source metrics", async () => {
  await withIsolatedStore(
    baseStore({
      sourceRegistry: [
        { id: "src_service_bund", name: "service.bund.de", active: true, status: "idle" }
      ],
      connectors: [
        { id: "src_service_bund", supportsQuerySearch: true, supportsDeepLink: true, supportsFeed: true, supportsManualImport: true }
      ],
      sourceHits: [
        { id: "h1", sourceId: "src_service_bund", directLinkValid: true, operationallyUsable: true, estimatedValue: 100, dueDate: "2026-05-01" },
        { id: "h2", sourceId: "src_service_bund", directLinkValid: false, operationallyUsable: false, estimatedValue: 0, dueDate: null }
      ]
    }),
    async () => {
      const res = await GET();
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.summary.sourceCount, 1);
      assert.equal(body.rows[0].hitsTotal, 2);
      assert.equal(body.rows[0].validLinks, 1);
      assert.equal(body.rows[0].invalidLinks, 1);
    }
  );
});

