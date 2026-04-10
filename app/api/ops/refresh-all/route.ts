import { NextResponse } from "next/server";
import { markLiveRun } from "@/lib/liveWorkbench";

async function safeFetch(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  try {
    return await res.json();
  } catch {
    return { ok: false, path };
  }
}

export async function GET() {
  try {
    await markLiveRun("running", "quellenabruf", "Live-Aktualisierung gestartet");

    const ingest = await safeFetch("/api/ops/live-ingest");
    await markLiveRun("running", "link-pruefung", "Quellen abgerufen, prüfe Direktlinks");

    const probe = await safeFetch("/api/ops/probe-deeplinks");
    await markLiveRun("running", "dashboard", "Direktlinks geprüft, aktualisiere Übersicht");

    const overview = await safeFetch("/api/ops/source-overview");
    await markLiveRun("running", "ai-bewertung", "Übersicht aktualisiert, bewerte Kandidaten");

    const analyze = await safeFetch("/api/ops/analyze-hits");

    await markLiveRun("done", "fertig", "Live-Aktualisierung erfolgreich abgeschlossen");

    return NextResponse.json({
      ok: true,
      ingest,
      probe,
      overview,
      analyze
    });
  } catch (error: any) {
    await markLiveRun("error", "abbruch", error?.message || "Unbekannter Fehler");
    return NextResponse.json(
      { ok: false, error: error?.message || "Refresh fehlgeschlagen" },
      { status: 500 }
    );
  }
}
