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
