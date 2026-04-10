import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRegionLabel, normalizeRegionFromHit } from "../lib/regionNormalization";

test("normalizeRegionLabel maps key regions", () => {
  assert.equal(normalizeRegionLabel("Berlin Mitte"), "Berlin");
  assert.equal(normalizeRegionLabel("Leipzig Nord"), "Leipzig / Schkeuditz");
  assert.equal(normalizeRegionLabel("Potsdam"), "Potsdam / Stahnsdorf");
  assert.equal(normalizeRegionLabel("Erfurt"), "Thüringen");
  assert.equal(normalizeRegionLabel("Halle (Saale)"), "Sachsen-Anhalt");
});

test("normalizeRegionFromHit prefers best candidate", () => {
  const hit = {
    region: "unbekannt",
    city: "Magdeburg",
    title: "Objektreinigung"
  };
  assert.equal(normalizeRegionFromHit(hit), "Magdeburg");
});

