import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.siteTradeRules || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("rule"), ...body };
  await appendToCollection("siteTradeRules", item);
  return NextResponse.json(item);
}
