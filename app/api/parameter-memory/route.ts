import { NextResponse } from "next/server";
import { listParameterMemory, upsertParameterMemory } from "@/lib/parameterMemory";

export async function GET() {
  return NextResponse.json(await listParameterMemory());
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = await upsertParameterMemory(body);
  return NextResponse.json(row);
}
