export function evaluateTender(tender: any) {
  if (tender.value > 400000) return "go";
  if (tender.value > 100000) return "prüfen";
  return "no-go";
}
