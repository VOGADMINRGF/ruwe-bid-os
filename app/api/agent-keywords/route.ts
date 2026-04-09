import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.agentKeywords || []);
}

export async function POST(req: Request) {
  const db = await readStore();
  const body = await req.json();
  const current = db.agentKeywords || [];
  const next = [...current, body];
  await replaceCollection("agentKeywords", next);
  return NextResponse.json(body);
}
