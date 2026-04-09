export function sourceUsefulnessScore(stat: any) {
  const found = stat.tendersLast30Days || 0;
  const pre = stat.prefilteredLast30Days || 0;
  const go = stat.goLast30Days || 0;
  const errors = stat.errorCountLastRun || 0;
  const dup = stat.duplicateCountLastRun || 0;

  return Math.max(0, (found * 1) + (pre * 2) + (go * 4) - (errors * 5) - (dup * 1));
}

export function sourceHealth(stat: any) {
  if (!stat) return "unbekannt";
  if (stat.lastRunOk && (stat.errorCountLastRun || 0) === 0) return "gruen";
  if ((stat.errorCountLastRun || 0) <= 1) return "gelb";
  return "rot";
}

export function aggregateHitsByRegionAndTrade(hits: any[]) {
  const map = new Map<string, any>();

  for (const hit of hits) {
    const key = `${hit.region}__${hit.trade}`;
    const existing = map.get(key) || {
      region: hit.region,
      trade: hit.trade,
      count: 0,
      volume: 0,
      durations: []
    };

    existing.count += 1;
    existing.volume += hit.estimatedValue || 0;
    if (typeof hit.durationMonths === "number") existing.durations.push(hit.durationMonths);

    map.set(key, existing);
  }

  return [...map.values()].map((row) => ({
    ...row,
    avgDurationMonths: row.durations.length
      ? Math.round(row.durations.reduce((a: number, b: number) => a + b, 0) / row.durations.length)
      : 0
  }));
}
