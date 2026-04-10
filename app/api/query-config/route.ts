import { NextResponse } from "next/server";
import { createQueryConfig, listQueryConfig } from "@/lib/queryConfig";

export async function GET() {
  return NextResponse.json(await listQueryConfig());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await createQueryConfig(body));
}
