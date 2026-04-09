"use client";

import { useState } from "react";

export default function SourcesTable({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [runningAll, setRunningAll] = useState(false);
  const [runPhases, setRunPhases] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, number>>({});

  async function refreshOne(sourceId: string) {
    setLoadingMap((m) => ({ ...m, [sourceId]: 10 }));

    const tick1 = setTimeout(() => setLoadingMap((m) => ({ ...m, [sourceId]: 45 })), 250);
    const tick2 = setTimeout(() => setLoadingMap((m) => ({ ...m, [sourceId]: 80 })), 700);

    try {
      const res = await fetch(`/api/ops/source-refresh/${sourceId}`, { method: "POST" });
      const data = await res.json();

      setRows((prev) =>
        prev.map((x: any) =>
          x.id === sourceId
            ? {
                ...x,
                status: data.status || "done",
                lastRunAt: new Date().toISOString(),
                lastRunOk: true
              }
            : x
        )
      );
      setLoadingMap((m) => ({ ...m, [sourceId]: 100 }));
      setTimeout(() => {
        setLoadingMap((m) => {
          const next = { ...m };
          delete next[sourceId];
          return next;
        });
      }, 500);
    } finally {
      clearTimeout(tick1);
      clearTimeout(tick2);
    }
  }

  async function runAll() {
    setRunningAll(true);
    setRunPhases([{ key: "fetch", status: "running" }]);

    const res = await fetch("/api/ops/run-all-phased", { method: "POST" });
    const data = await res.json();

    setRunPhases(data.phases || []);
    setRunningAll(false);
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <button className="button" type="button" onClick={runAll} disabled={runningAll}>
          {runningAll ? "Läuft..." : "Run All"}
        </button>
      </div>

      {runPhases.length ? (
        <div className="card soft">
          <div className="section-title">Run-All Fortschritt</div>
          <div className="stack" style={{ marginTop: 14 }}>
            {runPhases.map((p: any, i: number) => (
              <div key={`${p.key}_${i}`} className="row" style={{ justifyContent: "space-between" }}>
                <span>{p.key}</span>
                <span>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Status</th>
                <th>Letzter Lauf</th>
                <th>Treffer</th>
                <th>Deep-Link</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.status}</td>
                  <td>{row.lastRunAt || "-"}</td>
                  <td>{row.lastRunCount || 0}</td>
                  <td>{row.supportsDeepLink ? "ja" : "nein / unklar"}</td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button className="linkish" type="button" onClick={() => refreshOne(row.id)}>
                        Einzeln abrufen
                      </button>
                      {loadingMap[row.id] ? (
                        <div style={{ width: 180, background: "#ececf1", borderRadius: 999, overflow: "hidden", height: 8 }}>
                          <div style={{ width: `${loadingMap[row.id]}%`, background: "#e8893a", height: 8 }} />
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
