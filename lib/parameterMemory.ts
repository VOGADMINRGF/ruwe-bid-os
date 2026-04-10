import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listParameterMemory() {
  const db = await readStore();
  return toPlain(Array.isArray(db.parameterMemory) ? db.parameterMemory : []);
}

export async function upsertParameterMemory(entry: any) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const idx = rows.findIndex((x: any) =>
    x.type === entry.type &&
    x.trade === entry.trade &&
    x.region === entry.region
  );

  const next = [...rows];
  if (idx >= 0) next[idx] = { ...next[idx], ...entry };
  else next.push(entry);

  await replaceCollection("parameterMemory", next);
  return toPlain(entry);
}



export async function findParameter(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
) {
  const rows = await listParameterMemory();

  let input: {
    region?: string | null;
    trade?: string | null;
    type: string;
    key?: string | null;
  };

  if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1)) {
    input = {
      type: arg1.type,
      region: arg1.region ?? null,
      trade: arg1.trade ?? null,
      key: arg1.key ?? arg1.parameterKey ?? null
    };
  } else {
    input = {
      region: arg1 ?? null,
      trade: arg2 ?? null,
      type: arg3,
      key: arg4 ?? null
    };
  }

  const exact = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (input.trade ? x?.trade === input.trade : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    x?.status === "defined"
  );
  if (exact) return toPlain(exact);

  const byTradeOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.trade ? x?.trade === input.trade : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.region) &&
    x?.status === "defined"
  );
  if (byTradeOnly) return toPlain(byTradeOnly);

  const byRegionOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (byRegionOnly) return toPlain(byRegionOnly);

  const globalDefault = rows.find((x: any) =>
    x?.type === input.type &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.region) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (globalDefault) return toPlain(globalDefault);

  return null;
}
