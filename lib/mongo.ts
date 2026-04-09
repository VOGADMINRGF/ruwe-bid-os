import { MongoClient, Db } from "mongodb";
import { runtimeConfig } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __ruweMongoClient__: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!runtimeConfig.mongoUri) {
    throw new Error("MONGODB_URI missing");
  }

  if (!global.__ruweMongoClient__) {
    const client = new MongoClient(runtimeConfig.mongoUri);
    global.__ruweMongoClient__ = client.connect();
  }

  return global.__ruweMongoClient__;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(runtimeConfig.mongoDbName);
}
