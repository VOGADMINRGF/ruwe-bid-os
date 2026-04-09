import { NextResponse } from "next/server";
import { buildQueryMatrix } from "@/lib/queryMatrix";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";
import { appendQueryRun } from "@/lib/queryHistory";
import { getAdapter } from "@/lib/sourceAdapters";

export async function POST() {
  await ensureSourceCapabilities();
  const queries = await buildQueryMatrix();
  const limited = queries.slice(0, 24);

  const results = [];

  for (const q of limited) {
    const adapter = getAdapter(q.sourceId);
    if (!adapter || !adapter.canSearch) {
      results.push({
        sourceId: q.sourceId,
        query: q.query,
        inserted: false,
        duplicate: false,
        skipped: true
      });
      continue;
    }

    const res = await adapter.runQuery(q.query);
    results.push({
      sourceId: q.sourceId,
      query: q.query,
      inserted: res.inserted,
      duplicate: res.duplicate
    });
  }

  const inserted = results.filter((x: any) => x.inserted).length;
  const duplicates = results.filter((x: any) => x.duplicate).length;

  await appendQueryRun({
    mode: "query_ingest",
    queryCount: limited.length,
    inserted,
    duplicates,
    results
  });

  return NextResponse.json({
    ok: true,
    queries: limited.length,
    inserted,
    duplicates,
    results
  });
}
