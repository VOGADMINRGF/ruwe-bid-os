import { NextResponse } from "next/server";
import { buildQueryMatrix } from "@/lib/queryMatrix";
import { ingestQueryResult } from "@/lib/queryIngest";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";

export async function POST() {
  await ensureSourceCapabilities();
  const queries = await buildQueryMatrix();

  const limited = queries.slice(0, 24);
  const results = [];

  for (const q of limited) {
    const res = await ingestQueryResult(q);
    results.push({
      sourceId: q.sourceId,
      query: q.query,
      inserted: res.inserted,
      duplicate: res.duplicate
    });
  }

  return NextResponse.json({
    ok: true,
    queries: limited.length,
    results
  });
}
