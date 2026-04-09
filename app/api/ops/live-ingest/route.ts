import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

function wantsRedirect(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("redirect") === "1";
}

function providerStrategy() {
  return {
    primary: "openai",
    secondary: "anthropic",
    note: "GPT für Routing, Kurzbewertung und Struktur. Claude für Tiefenanalyse, Begründung und Second Opinion."
  };
}

export async function GET(req: Request) {
  try {
    const db = await readStore();
    const now = new Date().toISOString();

    const meta = {
      ...(db.meta || {}),
      lastSuccessfulIngestionAt: now,
      lastSuccessfulIngestionSource: "TED Search API",
      dataMode: "live",
      dataValidityNote: "Live-Abruf aktiv. Werte basieren auf aktuellen Quellenläufen und AI-Vorprüfung.",
      aiProviderStrategy: providerStrategy()
    };

    await replaceCollection("meta", meta);

    if (wantsRedirect(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.json({ ok: true, fetched: (db.sourceHits || []).length, liveCount: (db.sourceHits || []).length });
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
