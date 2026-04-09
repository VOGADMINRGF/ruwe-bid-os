import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  return NextResponse.json({
    ok: true,
    message: "JSON -> Mongo seed geprüft oder bereits vorhanden.",
    graphNodes: db.graphNodes?.length || 0,
    graphEdges: db.graphEdges?.length || 0
  });
}
