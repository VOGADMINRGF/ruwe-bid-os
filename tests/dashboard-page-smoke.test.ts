import test from "node:test";
import assert from "node:assert/strict";
import DashboardPage from "../app/page";
import { baseStore, withIsolatedStore } from "./helpers/storeHarness";

test("dashboard page builds without crashing on empty data store", async () => {
  await withIsolatedStore(baseStore(), async () => {
    const element = await DashboardPage({
      searchParams: Promise.resolve({})
    });
    assert.ok(element);
  });
});
