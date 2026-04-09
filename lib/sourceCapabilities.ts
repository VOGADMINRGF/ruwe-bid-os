import { readStore, replaceCollection } from "@/lib/storage";

export async function ensureSourceCapabilities() {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];

  const next = rows.map((x: any) => {
    const id = String(x.id || "");
    return {
      supportsFeed: true,
      supportsQuerySearch: ["src_service_bund", "src_ted", "src_berlin", "src_dtvp"].includes(id),
      supportsManualImport: true,
      supportsDeepLink: !!x.supportsDeepLink,
      ...x
    };
  });

  await replaceCollection("sourceRegistry", next);
  return next;
}
