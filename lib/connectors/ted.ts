function buildTedQuery(queries: string[] = []) {
  const tokens = [...new Set(
    queries
      .flatMap((query) => String(query || "").toLowerCase().split(" "))
      .map((x) => x.trim())
      .filter((x) => x.length >= 4)
  )].slice(0, 8);

  if (!tokens.length) {
    return "title ~ \"reinigung\" OR title ~ \"hausmeister\" OR title ~ \"winterdienst\" OR title ~ \"sicherheitsdienst\" OR title ~ \"grünpflege\"";
  }

  return tokens.map((token) => `title ~ "${token.replace(/"/g, "")}"`).join(" OR ");
}

export async function fetchTedNotices(queries: string[] = []) {
  const endpoint = "https://api.ted.europa.eu/v3/notices/search";

  const body = {
    query: buildTedQuery(queries),
    fields: [
      "notice-title",
      "publication-number",
      "publication-date",
      "deadline-receipt-tender-date",
      "buyer-name",
      "place-of-performance",
      "cpv",
      "estimated-value"
    ],
    page: 1,
    limit: 20
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`TED fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json;
}
