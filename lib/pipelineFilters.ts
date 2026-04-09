export function withComputedDates(items: any[]) {
  const now = new Date();
  return (items || []).map((item) => {
    const due = item?.dueDate ? new Date(item.dueDate) : null;
    const daysLeft =
      due && !Number.isNaN(due.getTime())
        ? Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return {
      ...item,
      daysLeft
    };
  });
}

export function filterPipelineByWindow(items: any[], windowKey: string) {
  const rows = withComputedDates(items);

  if (windowKey === "7d") {
    return rows.filter((x) => x.daysLeft !== null && x.daysLeft <= 7);
  }
  if (windowKey === "14d") {
    return rows.filter((x) => x.daysLeft !== null && x.daysLeft <= 14);
  }
  if (windowKey === "30d") {
    return rows.filter((x) => x.daysLeft !== null && x.daysLeft <= 30);
  }
  if (windowKey === "overdue") {
    return rows.filter((x) => x.daysLeft !== null && x.daysLeft < 0);
  }
  if (windowKey === "lost") {
    return rows.filter((x) => ["Verloren", "No-Bid", "Abgelehnt"].includes(x.stage));
  }
  return rows;
}

export function pipelineStageBuckets(items: any[]) {
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren", "No-Bid"];
  return stages.map((stage) => {
    const rows = (items || []).filter((x) => x.stage === stage);
    return {
      stage,
      count: rows.length,
      value: rows.reduce((sum, x) => sum + Number(x.value || 0), 0)
    };
  }).filter((x) => x.count > 0);
}
