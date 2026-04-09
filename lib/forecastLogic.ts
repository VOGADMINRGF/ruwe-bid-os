function daysUntil(dateStr?: string) {
  if (!dateStr) return 999;
  const now = new Date();
  const due = new Date(dateStr);
  if (Number.isNaN(due.getTime())) return 999;
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function deadlineBucket(dateStr?: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return "überfällig";
  if (d <= 7) return "7 Tage";
  if (d <= 14) return "14 Tage";
  if (d <= 30) return "30 Tage";
  return "später";
}

export function fieldRegionVolume(hits: any[]) {
  const map = new Map<string, any>();

  for (const hit of hits || []) {
    const trade = hit?.trade || "Sonstiges";
    const region = hit?.region || "Unbekannt";
    const key = `${trade}__${region}`;

    const current = map.get(key) || {
      trade,
      region,
      count: 0,
      volume: 0,
      bids: 0,
      reviews: 0
    };

    current.count += 1;
    current.volume += Number(hit?.estimatedValue || 0);
    if (hit?.aiRecommendation === "Bid" || hit?.status === "prefiltered") current.bids += 1;
    if (hit?.aiRecommendation === "Prüfen" || hit?.status === "manual_review") current.reviews += 1;

    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.volume - a.volume || b.count - a.count);
}

export function deadlineView(items: any[]) {
  return (items || [])
    .map((item) => ({
      ...item,
      daysLeft: daysUntil(item.dueDate),
      bucket: deadlineBucket(item.dueDate)
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function forecastRecommendations(hits: any[]) {
  const grouped = fieldRegionVolume(hits);
  return grouped.map((row) => {
    let recommendation = "Beobachten";
    if (row.bids >= 2 && row.volume >= 500000) {
      recommendation = "Aktiv fokussieren";
    } else if (row.reviews >= 1 || row.volume >= 250000) {
      recommendation = "Gezielt prüfen";
    }

    return {
      ...row,
      recommendation
    };
  });
}
