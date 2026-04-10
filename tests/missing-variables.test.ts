import test from "node:test";
import assert from "node:assert/strict";
import { deriveMissingVariables } from "../lib/missingVariables";

test("deriveMissingVariables creates typed variables for unclear opportunities", () => {
  const opportunity = {
    id: "opp_1",
    region: "Berlin",
    trade: "Reinigung",
    calcMode: "unklar",
    estimatedValue: 0,
    directLinkValid: false,
    dueDate: null,
    buyer: null
  };
  const vars = deriveMissingVariables(opportunity, []);

  const types = vars.map((x: any) => x.type);
  assert.ok(types.includes("calc_mode"));
  assert.ok(types.includes("direct_link"));
  assert.ok(types.includes("due_date"));
  assert.ok(types.includes("buyer"));

  const calc = vars.find((x: any) => x.type === "calc_mode");
  assert.equal(calc.answerKind, "kalkulationsmodus");
  assert.ok(Array.isArray(calc.answerOptions));
});

