import { readFile, writeFile } from "fs/promises";
import path from "path";

const root = process.cwd();
const src = path.join(root, "data", "db.json");
const raw = await readFile(src, "utf8");
const data = JSON.parse(raw);
data.meta.lastSeededAt = new Date().toISOString();
await writeFile(src, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("db.json reseeded timestamp updated");
