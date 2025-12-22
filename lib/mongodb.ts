import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "newsdb";

if (!uri) {
    console.warn("MONGODB_URI not set — MongoDB access will fail in runtime");
}

let cached: { client: MongoClient; db: any } | undefined;

export async function getDb() {
    if (cached) return cached.db;

    if (!uri) throw new Error("MONGODB_URI environment variable is required");

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    cached = { client, db };
    return db;
}

export async function fetchCryptoNews(limit = 50) {
    const db = await getDb();
    const col = db.collection("news");
    const docs = await col
        .find({})
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map((d: any) => ({
        id: d._id?.toString(),
        title: d.title ?? "",
        summary: d.summary ?? d.excerpt ?? "",
        url: d.url ?? "",
        source: d.source ?? d.source_name ?? "",
        publishedAt: d.publishedAt ?? d.published_at ?? null,
    }));
}
