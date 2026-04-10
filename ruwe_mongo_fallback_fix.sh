#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

python3 - <<'PY'
from pathlib import Path

p = Path("lib/storage.ts")
text = p.read_text()

text = text.replace(
"""async function getMongoConn() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}""",
"""async function getMongoConn() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 8000,
      retryWrites: true
    });

    await client.connect();
    return { client, db: client.db(dbName) };
  } catch (error) {
    console.warn("[storage] Mongo connect failed, falling back to JSON store.");
    return null;
  }
}"""
)

text = text.replace(
"""async function readMongoStore(): Promise<StoreShape | null> {
  const conn = await getMongoConn();
  if (!conn) return null;

  try {
    const out: any = {};
    for (const name of ALL_COLLECTIONS) {
      const rows = await conn.db.collection(name).find({}).toArray();
      if (name === "meta" || name === "config" || name === "globalKeywords") {
        out[name] = rows[0] || (name === "globalKeywords" ? { positive: [], negative: [] } : {});
      } else {
        out[name] = rows;
      }
    }
    return normalizeStore(out);
  } catch {
    return null;
  } finally {
    await conn.client.close();
  }
}""",
"""async function readMongoStore(): Promise<StoreShape | null> {
  const conn = await getMongoConn();
  if (!conn) return null;

  try {
    const out: any = {};
    for (const name of ALL_COLLECTIONS) {
      const rows = await conn.db.collection(name).find({}).toArray();
      if (name === "meta" || name === "config" || name === "globalKeywords") {
        out[name] = rows[0] || (name === "globalKeywords" ? { positive: [], negative: [] } : {});
      } else {
        out[name] = rows;
      }
    }
    return normalizeStore(out);
  } catch (error) {
    console.warn("[storage] Mongo read failed, falling back to JSON store.");
    return null;
  } finally {
    try {
      await conn.client.close();
    } catch {}
  }
}"""
)

text = text.replace(
"""async function replaceMongoCollection(name: StoreCollection, value: any) {
  const conn = await getMongoConn();
  if (!conn) return false;

  try {
    const col = conn.db.collection(name);
    await col.deleteMany({});

    const docs = asInsertDocs(value);
    if (docs.length > 0) {
      await col.insertMany(docs);
    }
    return true;
  } finally {
    await conn.client.close();
  }
}""",
"""async function replaceMongoCollection(name: StoreCollection, value: any) {
  const conn = await getMongoConn();
  if (!conn) return false;

  try {
    const col = conn.db.collection(name);
    await col.deleteMany({});

    const docs = asInsertDocs(value);
    if (docs.length > 0) {
      await col.insertMany(docs);
    }
    return true;
  } catch (error) {
    console.warn(`[storage] Mongo write failed for ${name}, falling back to JSON store.`);
    return false;
  } finally {
    try {
      await conn.client.close();
    } catch {}
  }
}"""
)

p.write_text(text)
print("Mongo fallback patched.")
PY

npm run build || true
git add lib/storage.ts
git commit -m "fix: make mongo optional with fast fallback to local json store" || true
git push origin main || true
