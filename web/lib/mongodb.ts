import 'server-only'

import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// ✅ Better caching pattern for Next.js
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
    if (cachedDb && cachedClient) return cachedDb;

    const uri = process.env.MONGODB_URI || "";
    const dbName = process.env.MONGODB_DB || "seeking-alpha";

    if (!uri) {
        console.warn("MONGODB_URI not set — MongoDB access will fail in runtime");
        throw new Error("MONGODB_URI environment variable is required");
    }

    const client = new MongoClient(uri);
    await client.connect();

    cachedClient = client;
    cachedDb = client.db(dbName);

    return cachedDb;
}

export async function closeDb(): Promise<void> {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
        cachedDb = null;
    }
}