import { NextResponse } from "next/server";
import { refreshAllSources } from "@/lib/sourceRefreshOrchestrator";
import { readStore, replaceCollection } from "@/lib/storage";

function wantsRedirect(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("redirect") === "1";
}

function providerStrategy() {
  return {
    primary: "openai",
    secondary: "anthropic",
    note: "GPT primär, Claude als Zweitmeinung/Fallback."
  };
}

export async function GET(req: Request) {
  try {
    const result = await refreshAllSources();
    const db = await readStore();
    const now = new Date().toISOString();

    await replaceCollection("meta", {
      ...(db.meta || {}),
      lastSuccessfulIngestionAt: now,
      lastSuccessfulIngestionSource: "Source-Orchestrator",
      dataMode: "live",
      dataValidityNote: "Quellenabruf pro Quelle durchgeführt, Direktlink- und Query-Status je Quelle aktualisiert.",
      aiProviderStrategy: providerStrategy()
    });

    if (wantsRedirect(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.json({
      ok: result.ok,
      fetchedSources: result.summary.sourceCount,
      insertedHits: result.summary.inserted,
      usableHits: result.summary.usableHits,
      invalidDirectLinks: result.summary.invalidDirectLinks,
      sources: result.results
    });
  } catch (error: any) {
    if (wantsRedirect(req)) {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error?.message || "live_ingest_failed")}`, req.url));
    }

    return NextResponse.json(
      { ok: false, error: error?.message || "live_ingest_failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
