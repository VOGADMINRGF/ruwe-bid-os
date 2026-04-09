import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.tenders || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("t"), ...body };
  await appendToCollection("tenders", item);
  return NextResponse.json(item);
}
