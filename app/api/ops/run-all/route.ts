import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { enrichHitsStrictAndLearn } from "@/lib/hitEnrichment";

async function callLocal(path: string, origin: string) {
  const res = await fetch(`${origin}${path}`, { cache: "no-store" });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, ok: res.ok };
  }
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;

  const ingest = await callLocal("/api/ops/live-ingest", origin);
  const enrich = await enrichHitsStrictAndLearn();
  const analyze = await callLocal("/api/ops/analyze-hits", origin);

  const db = await readStore();

  return NextResponse.json({
    ok: true,
    ingest,
    enrich,
    analyze,
    final: {
      hits: (db.sourceHits || []).length,
      usableHits: (db.sourceHits || []).filter((x: any) => x.operationallyUsable).length,
      invalidLinks: (db.sourceHits || []).filter((x: any) => x.directLinkValid === false).length,
      openParameters: Array.isArray(db.parameterMemory) ? db.parameterMemory.filter((x: any) => x.status === "open").length : 0
    }
  });
}
