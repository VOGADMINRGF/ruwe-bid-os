import { NextResponse } from "next/server";
import { enrichSourceHitsForValidityAndEstimation } from "@/lib/aiEnrichment";
import { readStore } from "@/lib/storage";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await enrichSourceHitsForValidityAndEstimation();
  const db = await readStore();
  const hit = (db.sourceHits || []).find((x: any) => x.id === id);
  return NextResponse.json(hit || null);
}
