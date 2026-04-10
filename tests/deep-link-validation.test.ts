import test from "node:test";
import assert from "node:assert/strict";
import { strictDirectLink } from "../lib/strictLinkValidation";

test("strictDirectLink accepts concrete notice links", () => {
  const result = strictDirectLink({
    detailUrl: "https://ted.europa.eu/en/notice/-/detail/123456-2026"
  });
  assert.equal(result.valid, true);
  assert.equal(result.status, "direct_notice");
});

test("strictDirectLink rejects homepage/search links", () => {
  const home = strictDirectLink({ url: "https://www.service.bund.de/" });
  assert.equal(home.valid, false);

  const search = strictDirectLink({ url: "https://www.service.bund.de/search?q=reinigung" });
  assert.equal(search.valid, false);
  assert.equal(search.status, "homepage_or_search");
});

