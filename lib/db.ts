import { createId, readStore, writeDb as writeStore } from "@/lib/storage";

export async function readJsonDb() {
  return readStore();
}

export async function writeJsonDb(data: any) {
  return writeStore(data);
}

export async function readDb() {
  return readStore();
}

export async function writeDbCompat(data: any) {
  return writeStore(data);
}

export async function writeDb(data: any) {
  return writeDbCompat(data);
}

export { createId };
