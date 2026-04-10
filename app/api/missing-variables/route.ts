import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(Array.isArray(db.costGaps) ? db.costGaps : []);
}
