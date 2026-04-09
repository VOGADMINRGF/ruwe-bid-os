function parseTag(item: string, tag: string) {
  const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

export async function fetchServiceBundRss() {
  const url = "https://www.service.bund.de/Content/Globals/Functions/RSSFeed/RSSGenerator_Ausschreibungen.xml";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`service.bund RSS failed: ${res.status}`);

  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map((chunk) => chunk.split("</item>")[0]);

  return items.slice(0, 20).map((item, idx) => ({
    id: `sb_${idx + 1}`,
    title: parseTag(item, "title"),
    link: parseTag(item, "link"),
    description: parseTag(item, "description"),
    pubDate: parseTag(item, "pubDate")
  }));
}
