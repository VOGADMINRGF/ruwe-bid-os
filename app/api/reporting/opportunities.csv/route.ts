import { readStore } from "@/lib/storage";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];
  const headers = [
    "id",
    "title",
    "region",
    "trade",
    "decision",
    "fitScore",
    "fitBucket",
    "ownerId",
    "supportOwnerId",
    "missingVariableCount",
    "nextStep",
    "externalResolvedUrl"
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row: any) =>
      headers.map((key) => csvEscape(row?.[key])).join(",")
    )
  ];
  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ruwe-opportunities-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

