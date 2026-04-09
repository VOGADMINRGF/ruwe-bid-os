import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const db = await readStore();
  let hits = db.sourceHits || [];
  if (status) hits = hits.filter((x: any) => x.status === status);

  return NextResponse.json({
    hits,
    grouped: aggregateHitsByRegionAndTrade(hits)
  });
}
