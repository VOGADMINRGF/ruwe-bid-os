import { readStore } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function findParam(rows: any[], region: string, trade: string, key: string) {
  return (
    rows.find((x: any) =>
      x.region === region &&
      x.trade === trade &&
      x.parameterKey === key &&
      x.status === "confirmed"
    ) ||
    rows.find((x: any) =>
      x.trade === trade &&
      x.parameterKey === key &&
      x.status === "confirmed"
    ) ||
    null
  );
}

export async function calculateOpportunity(opportunity: any) {
  const db = await readStore();
  const params = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const region = opportunity.region || "Unbekannt";
  const trade = opportunity.trade || "Unbekannt";
  const specs = opportunity.extractedSpecs || {};

  const defaultRate = findParam(params, region, trade, "default_rate");
  const travelCost = findParam(params, region, trade, "travel_cost");
  const surcharge = findParam(params, region, trade, "surcharge_percent");

  const duration = n(specs.durationMonths || opportunity.durationMonths || 12);
  const sqm = n(specs.areaSqm || 0);
  const hours = n(specs.hours || 0);

  let base = 0;
  let method = "fallback";

  if (defaultRate) {
    if (trade === "Reinigung" && sqm > 0) {
      base = n(defaultRate.value) * sqm * duration;
      method = "sqm_month";
    } else if (trade === "Sicherheit" && hours > 0) {
      base = n(defaultRate.value) * hours;
      method = "hours";
    } else {
      base = n(defaultRate.value) * duration;
      method = "object_month";
    }
  }

  let total = base;

  if (travelCost) total += n(travelCost.value);
  if (surcharge) total += total * (n(surcharge.value) / 100);

  return {
    calculatedValue: Math.round(total),
    calculationMethod: method,
    calculationInputs: {
      region,
      trade,
      duration,
      sqm,
      hours,
      defaultRate: defaultRate?.value ?? null,
      travelCost: travelCost?.value ?? null,
      surchargePercent: surcharge?.value ?? null
    }
  };
}
