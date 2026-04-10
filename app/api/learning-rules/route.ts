import { NextResponse } from "next/server";
import { addLearningRule, listLearningRules } from "@/lib/learningRules";

export async function GET() {
  return NextResponse.json(await listLearningRules());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await addLearningRule(body));
}
