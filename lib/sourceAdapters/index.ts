import { serviceBundAdapter } from "./serviceBund";
import { tedAdapter } from "./ted";
import { berlinAdapter } from "./berlin";
import { dtvpAdapter } from "./dtvp";

export const sourceAdapters = [
  serviceBundAdapter,
  tedAdapter,
  berlinAdapter,
  dtvpAdapter
];

export function getAdapter(sourceId: string) {
  return sourceAdapters.find((x) => x.sourceId === sourceId) || null;
}
