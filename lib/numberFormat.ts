export function formatCurrencyCompact(value?: number | null) {
  const v = Number(value || 0);
  if (v >= 1000000) {
    const m = v / 1000000;
    return `${m.toFixed(m >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")} Mio. €`;
  }
  if (v >= 1000) {
    const k = v / 1000;
    return `${k.toFixed(k >= 100 ? 0 : 1).replace(/\.0$/, "")} Tsd. €`;
  }
  return `${v.toFixed(0)} €`;
}

export function formatIntegerCompact(value?: number | null) {
  const v = Number(value || 0);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")} Mio.`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")} Tsd.`;
  return `${v}`;
}
