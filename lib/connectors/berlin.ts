function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß");
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTag(item: string, tag: string) {
  const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? stripHtml(m[1]) : "";
}

function extractField(description: string, label: string) {
  const m = description.match(new RegExp(`${label}:\\s*([^|]+)`, "i"));
  return m ? String(m[1]).trim() : "";
}

function extractDueDate(description: string) {
  const patterns = [
    /Ablauf(?:\s+der)?\s+Angebotsfrist:\s*([^|]+)/i,
    /Ablauf(?:\s+der)?\s+Teilnahmefrist:\s*([^|]+)/i,
    /Eröffnungstermin:\s*([^|]+)/i
  ];
  for (const pattern of patterns) {
    const m = description.match(pattern);
    if (m) return String(m[1]).trim();
  }
  return "";
}

export async function fetchBerlinBekanntmachungenRss() {
  const url = "https://www.berlin.de/vergabeplattform/veroeffentlichungen/bekanntmachungen/feed.rss";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`berlin RSS failed: ${res.status}`);

  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0]);

  return items.slice(0, 80).map((item, idx) => {
    const title = parseTag(item, "title");
    const link = parseTag(item, "link");
    const description = parseTag(item, "description");
    const pubDate = parseTag(item, "pubDate");
    const place = extractField(description, "Ausführungsort");
    const procedure = extractField(description, "Verfahrensart");
    const dueDate = extractDueDate(description);

    return {
      id: `berlin_${idx + 1}`,
      title,
      link,
      description,
      region: place || "Berlin",
      place,
      procedure,
      dueDate,
      pubDate
    };
  });
}

