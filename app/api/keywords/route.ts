import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  const keywords = (db.siteTradeRules || []).map((r: any) => ({
    id: r.id,
    siteId: r.siteId,
    trade: r.trade,
    positive: r.keywordsPositive || [],
    negative: r.keywordsNegative || [],
    regionNotes: r.regionNotes || ""
  }));
  return NextResponse.json(keywords);
}
