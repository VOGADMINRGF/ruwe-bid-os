import { NextResponse } from "next/server";
import { createConnector, listConnectors } from "@/lib/connectors";

export async function GET() {
  return NextResponse.json(await listConnectors());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await createConnector(body));
}
