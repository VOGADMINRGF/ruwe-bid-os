import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  return NextResponse.json({
    ok: true,
    counts: {
      sites: db.sites?.length || 0,
      serviceAreas: db.serviceAreas?.length || 0,
      rules: db.siteTradeRules?.length || 0,
      tenders: db.tenders?.length || 0
    }
  });
}
