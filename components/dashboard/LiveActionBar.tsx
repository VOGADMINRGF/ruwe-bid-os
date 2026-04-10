"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveActionBar({ liveState }: { liveState: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(path: string) {
    setLoading(true);
    try {
      await fetch(path, { cache: "no-store" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="toolbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-title">Live-Steuerung</div>
          <div className="sub" style={{ marginTop: 6 }}>
            Status: {liveState.status} {liveState.step ? `· ${liveState.step}` : ""}
          </div>
        </div>

        <div className="toolbar">
          <button className="button" type="button" onClick={() => run("/api/ops/refresh-all")} disabled={loading}>
            {loading ? "Aktualisiert..." : "Jetzt aktualisieren"}
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/live-ingest")} disabled={loading}>
            Quellen abrufen
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/probe-deeplinks")} disabled={loading}>
            Links prüfen
          </button>
          <button className="button-secondary" type="button" onClick={() => run("/api/ops/analyze-hits")} disabled={loading}>
            AI bewerten
          </button>
        </div>
      </div>
    </div>
  );
}
