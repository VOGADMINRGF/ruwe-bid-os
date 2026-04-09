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
    .replace(/&szlig;/g, "ß")
    .replace(/&#252;/g, "ü")
    .replace(/&#228;/g, "ä")
    .replace(/&#246;/g, "ö")
    .replace(/&#223;/g, "ß");
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, " | ")
    .replace(/<\/?strong>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTag(item: string, tag: string) {
  const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? stripHtml(m[1]) : "";
}

function extractRegion(description: string) {
  const text = description || "";
  const m =
    text.match(/Erf(?:üll|u)llungsort:\s*([^|]+)/i) ||
    text.match(/Ort:\s*([^|]+)/i);
  return m ? m[1].trim() : text.slice(0, 80).trim();
}

function extractPostalCode(text: string) {
  const m = text.match(/\b\d{5}\b/);
  return m ? m[0] : "";
}

export async function fetchServiceBundRss() {
  const url = "https://www.service.bund.de/Content/Globals/Functions/RSSFeed/RSSGenerator_Ausschreibungen.xml";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`service.bund RSS failed: ${res.status}`);

  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0]);

  return items.slice(0, 30).map((item, idx) => {
    const title = parseTag(item, "title");
    const link = parseTag(item, "link");
    const description = parseTag(item, "description");
    const pubDate = parseTag(item, "pubDate");
    const region = extractRegion(description);
    const postalCode = extractPostalCode(description);

    return {
      id: `sb_${idx + 1}`,
      title,
      link,
      description,
      region,
      postalCode,
      pubDate
    };
  });
}
