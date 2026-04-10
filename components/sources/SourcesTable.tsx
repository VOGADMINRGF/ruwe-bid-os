"use client";

import { useState } from "react";

export default function SourcesTable({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows || []);
  const [runningAll, setRunningAll] = useState(false);
  const [runPhases, setRunPhases] = useState<any[]>([]);
  const [runSummary, setRunSummary] = useState<any>(null);
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
                lastRunAt: data.finishedAt || new Date().toISOString(),
                lastRunOk: data.ok === true,
                lastRunCount: data.matchedHits ?? x.lastRunCount ?? 0,
                hitsTotal: (x.hitsTotal || 0) + (data.inserted || 0),
                validLinks: data.usableHits ?? x.validLinks ?? 0,
                invalidLinks: data.invalidDirectLinks ?? x.invalidLinks ?? 0,
                operationalHits: data.usableHits ?? x.operationalHits ?? 0,
                queryStatus: data.queryResults?.every((q: any) => q.status === "ok")
                  ? "ok"
                  : data.queryResults?.some((q: any) => q.status === "ok")
                    ? "partial"
                    : (data.queryResults?.[0]?.status || "no_results"),
                resultStatus: data.status || x.resultStatus,
                lastQuery: data.queryResults?.map((q: any) => q.query).filter(Boolean).join(" | ") || x.lastQuery
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
    setRunPhases([{ key: "source_refresh", status: "running" }]);
    setRunSummary(null);
    try {
      const res = await fetch("/api/ops/run-all-phased", { method: "POST" });
      const data = await res.json();

      setRunPhases(data.phases || []);
      setRunSummary(data.summary || null);

      const sourcePhase = (data.phases || []).find((x: any) => x.key === "source_refresh");
      const sourceRows = sourcePhase?.result?.results || [];
      if (Array.isArray(sourceRows) && sourceRows.length) {
        setRows((prev) =>
          prev.map((row: any) => {
            const refreshed = sourceRows.find((x: any) => x.sourceId === row.id);
            if (!refreshed) return row;
            return {
              ...row,
              status: refreshed.status,
              lastRunAt: refreshed.finishedAt || row.lastRunAt,
              lastRunCount: refreshed.matchedHits ?? row.lastRunCount,
              validLinks: refreshed.usableHits ?? row.validLinks,
              invalidLinks: refreshed.invalidDirectLinks ?? row.invalidLinks,
              operationalHits: refreshed.usableHits ?? row.operationalHits,
              queryStatus: refreshed.queryResults?.every((q: any) => q.status === "ok")
                ? "ok"
                : refreshed.queryResults?.some((q: any) => q.status === "ok")
                  ? "partial"
                  : (refreshed.queryResults?.[0]?.status || row.queryStatus),
              resultStatus: refreshed.status || row.resultStatus,
              lastQuery: refreshed.queryResults?.map((q: any) => q.query).filter(Boolean).join(" | ") || row.lastQuery
            };
          })
        );
      }
    } finally {
      setRunningAll(false);
    }
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
          {runSummary ? (
            <div className="meta" style={{ marginTop: 8 }}>
              Treffer: {runSummary.hits || 0} · Verwertbar: {runSummary.usableHits || 0} · Invalid Links: {runSummary.invalidLinks || 0}
            </div>
          ) : null}
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
                <th>Treffer letzter Lauf</th>
                <th>Verwertbar</th>
                <th>Invalid Links</th>
                <th>Query-Status</th>
                <th>Score</th>
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
                  <td>{row.operationalHits ?? 0}</td>
                  <td>{row.invalidLinks ?? 0}</td>
                  <td>{row.queryStatus || "-"}</td>
                  <td>{row.score ?? "-"}</td>
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
