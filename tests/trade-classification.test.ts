import test from "node:test";
import assert from "node:assert/strict";
import { classifyTrade, detectCalcMode } from "../lib/tradeClassification";

test("classifyTrade recognizes core trades", () => {
  assert.equal(classifyTrade({ title: "Unterhaltsreinigung Schule" }), "Reinigung");
  assert.equal(classifyTrade({ title: "Winterdienst inkl. Schneeräumung" }), "Winterdienst");
  assert.equal(classifyTrade({ title: "Objektschutz und Wachdienst" }), "Sicherheit");
  assert.equal(classifyTrade({ title: "Hausmeisterservice Objekt A" }), "Hausmeister");
});

test("detectCalcMode recognizes key modes", () => {
  assert.equal(detectCalcMode({ title: "Abrechnung nach Stundensatz 42 EUR/h" }), "Stunden");
  assert.equal(detectCalcMode({ title: "Leistung je qm Fläche" }), "Fläche");
  assert.equal(detectCalcMode({ title: "monatlich im Turnus ausführen" }), "Turnus");
  assert.equal(detectCalcMode({ title: "Pauschale pro Monat" }), "Pauschale");
});

