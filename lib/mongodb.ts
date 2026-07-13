import dotenv from "dotenv";
import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type Collection } from "mongodb";
import type { Note } from "../src/types";

dotenv.config({ path: ".env.local" });
dotenv.config();

const uri = process.env.STORAGE_MONGODB_URI;

if (!uri) {
  throw new Error("STORAGE_MONGODB_URI is required");
}

const client = new MongoClient(uri);
attachDatabasePool(client);

const database = client.connect().then((connectedClient) =>
  connectedClient.db(process.env.MONGODB_DATABASE ?? "freedomwall")
);

export async function getNotesCollection(): Promise<Collection<Note>> {
  const db = await database;
  return db.collection<Note>("notes");
}
