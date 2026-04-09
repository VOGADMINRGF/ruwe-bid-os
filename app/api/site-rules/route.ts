import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.siteTradeRules || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const item = { id: createId("rule"), ...body };
  db.siteTradeRules.unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
