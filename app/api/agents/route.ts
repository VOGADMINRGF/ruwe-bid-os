import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

const key = "agents";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db[key] || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const prefix = key.slice(0,1);
  const item = { id: createId(prefix), ...body };
  db[key].unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
