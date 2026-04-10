import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

const DEFAULT_PRESETS = [
  { id: "preset_winterdienst_berlin", label: "Winterdienst Berlin", sourceId: "src_service_bund", query: "Winterdienst Berlin", active: true },
  { id: "preset_reinigung_magdeburg", label: "Reinigung Magdeburg", sourceId: "src_service_bund", query: "Reinigung Magdeburg", active: true },
  { id: "preset_gruenpflege_potsdam", label: "Grünpflege Potsdam", sourceId: "src_service_bund", query: "Grünpflege Potsdam", active: true },
  { id: "preset_sicherheit_berlin", label: "Sicherheit Berlin", sourceId: "src_service_bund", query: "Sicherheit Berlin", active: true },
  { id: "preset_hausmeister_leipzig", label: "Hausmeister Leipzig", sourceId: "src_service_bund", query: "Hausmeister Leipzig", active: true }
];

export async function ensureLiveQueryPresets() {
  const db = await readStore();
  const rows = Array.isArray(db.liveQueryPresets) ? db.liveQueryPresets : [];
  if (rows.length) return toPlain(rows);

  await replaceCollection("liveQueryPresets" as any, DEFAULT_PRESETS as any);
  return toPlain(DEFAULT_PRESETS);
}

export async function listLiveQueryPresets() {
  await ensureLiveQueryPresets();
  const db = await readStore();
  return toPlain(Array.isArray(db.liveQueryPresets) ? db.liveQueryPresets : []);
}
