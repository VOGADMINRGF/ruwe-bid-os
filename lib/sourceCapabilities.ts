import { readStore, replaceCollection } from "@/lib/storage";

export async function ensureSourceCapabilities() {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];

  const next = rows.map((x: any) => {
    const id = String(x.id || "");
    const defaultSearch = ["src_service_bund", "src_ted", "src_berlin"].includes(id);
    return {
      supportsFeed: typeof x.supportsFeed === "boolean" ? x.supportsFeed : true,
      supportsQuerySearch:
        typeof x.supportsQuerySearch === "boolean"
          ? x.supportsQuerySearch
          : defaultSearch,
      supportsManualImport:
        typeof x.supportsManualImport === "boolean" ? x.supportsManualImport : true,
      supportsDeepLink:
        typeof x.supportsDeepLink === "boolean" ? x.supportsDeepLink : false,
      ...x
    };
  });

  await replaceCollection("sourceRegistry", next);
  return next;
}
