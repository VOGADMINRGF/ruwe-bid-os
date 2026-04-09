import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  const rows = (db.siteTradeRules || []).map((r: any) => ({
    id: r.id,
    siteId: r.siteId,
    trade: r.trade,
    positive: r.keywordsPositive || [],
    negative: r.keywordsNegative || [],
    regionNotes: r.regionNotes || ""
  }));
  return NextResponse.json(rows);
}
