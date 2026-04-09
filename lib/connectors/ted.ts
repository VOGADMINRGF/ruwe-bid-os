export async function fetchTedNotices() {
  const endpoint = "https://api.ted.europa.eu/v3/notices/search";

  const body = {
    query: "title ~ \"reinigung\" OR title ~ \"hausmeister\" OR title ~ \"winterdienst\" OR title ~ \"sicherheitsdienst\" OR title ~ \"grünpflege\"",
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
