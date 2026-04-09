import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.serviceAreas || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("sa"), ...body };
  await appendToCollection("serviceAreas", item);
  return NextResponse.json(item);
}
