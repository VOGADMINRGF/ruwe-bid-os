import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("sourceId");
  const onlyNew = searchParams.get("onlyNew") === "true";

  const db = await readStore();
  let hits = db.sourceHits || [];

  if (sourceId) hits = hits.filter((x: any) => x.sourceId === sourceId);
  if (onlyNew) hits = hits.filter((x: any) => x.addedSinceLastFetch);

  return NextResponse.json({
    hits,
    summary: aggregateHitsByRegionAndTrade(hits)
  });
}
