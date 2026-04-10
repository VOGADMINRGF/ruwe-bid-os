import { NextResponse } from "next/server";
import { listParameterMemory, upsertParameterMemory } from "@/lib/parameterMemory";

export async function GET() {
  return NextResponse.json(await listParameterMemory());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await upsertParameterMemory(body));
}
