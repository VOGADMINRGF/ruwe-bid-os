import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.config || {});
}

export async function PUT(req: Request) {
  const patch = await req.json();
  const db = await readDb();
  db.config = { ...db.config, ...patch };
  await writeDb(db);
  return NextResponse.json(db.config);
}
