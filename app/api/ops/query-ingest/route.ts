import { NextResponse } from "next/server";
import { ensureQueryConfig, listQueryConfig } from "@/lib/queryConfig";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";
import { appendQueryRun } from "@/lib/queryHistory";
import { getAdapter } from "@/lib/sourceAdapters";

export async function POST() {
  await ensureSourceCapabilities();
  await ensureQueryConfig();
  const queryRows = await listQueryConfig();
  const active = queryRows.filter((x: any) => x.active !== false);
  const limited = active.slice(0, 80);

  const results = [];

  for (const q of limited) {
    const adapter = getAdapter(q.sourceId);
    if (!adapter || !adapter.canSearch) {
      results.push({
        sourceId: q.sourceId,
        trade: q.trade || null,
        region: q.region || null,
        query: q.query,
        inserted: false,
        duplicate: false,
        skipped: true,
        status: "unsupported",
        reason: "Quelle nicht suchfähig angebunden"
      });
      continue;
    }

    const res = await adapter.runQuery(q.query);
    results.push({
      sourceId: q.sourceId,
      trade: q.trade || null,
      region: q.region || null,
      query: q.query,
      inserted: res.inserted,
      duplicate: res.duplicate,
      status: res.status || (res.inserted ? "ok" : res.duplicate ? "duplicate" : "unknown"),
      reason: res.reason || null
    });
  }

  const inserted = results.filter((x: any) => x.inserted).length;
  const duplicates = results.filter((x: any) => x.duplicate).length;
  const unsupported = results.filter((x: any) => x.status === "unsupported").length;
  const noMatch = results.filter((x: any) => x.status === "no_match").length;
  const invalidLink = results.filter((x: any) => x.status === "invalid_link").length;
  const usable = results.filter((x: any) => x.inserted && x.status !== "invalid_link").length;

  await appendQueryRun({
    mode: "query_ingest",
    queryCount: limited.length,
    inserted,
    duplicates,
    unsupported,
    noMatch,
    invalidLink,
    usableHits: usable,
    results
  });

  return NextResponse.json({
    ok: true,
    queries: limited.length,
    inserted,
    duplicates,
    unsupported,
    noMatch,
    invalidLink,
    usableHits: usable,
    results
  });
}
