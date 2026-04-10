"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SourceTestsActions() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");

  async function run(runRefresh: boolean) {
    setRunning(true);
    setLabel(runRefresh ? "Tests + Refresh laufen..." : "Connector-Tests laufen...");
    try {
      await fetch("/api/source-tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runRefresh })
      });
      router.refresh();
      setLabel(runRefresh ? "Tests + Refresh abgeschlossen" : "Connector-Tests abgeschlossen");
    } finally {
      setRunning(false);
      setTimeout(() => setLabel(""), 2500);
    }
  }

  return (
    <div className="toolbar" style={{ marginTop: 12 }}>
      <button className="button" type="button" onClick={() => run(false)} disabled={running}>
        Connector-Tests ausführen
      </button>
      <button className="button-secondary" type="button" onClick={() => run(true)} disabled={running}>
        Tests + Source-Refresh
      </button>
      {label ? <span className="meta">{label}</span> : null}
    </div>
  );
}

