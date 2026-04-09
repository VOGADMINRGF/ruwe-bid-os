import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.costModels || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = {
    id: body.id || nextId("costmodel"),
    region: body.region || "Unbekannt",
    trade: body.trade || "Unbekannt",
    unit: body.unit || "object_month",
    minRate: Number(body.minRate || 0),
    maxRate: Number(body.maxRate || 0),
    defaultRate: Number(body.defaultRate || 0),
    source: body.source || "",
    note: body.note || "",
    status: body.status || "active"
  };
  await appendToCollection("costModels" as any, row);
  return NextResponse.json(row);
}
