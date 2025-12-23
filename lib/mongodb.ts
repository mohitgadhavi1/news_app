import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "seeking-alpha";

if (!uri) {
    console.warn("MONGODB_URI not set — MongoDB access will fail in runtime");
}

// ✅ Properly typed cache
let cached: { client: MongoClient; db: Db } | undefined;

export async function getDb(): Promise<Db> {
    if (cached) return cached.db;

    if (!uri) throw new Error("MONGODB_URI environment variable is required");

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    cached = { client, db };
    return db;
}

// ✅ Updated document interface matching your schema
interface CryptoNewsDocument {
    _id?: ObjectId;
    source?: string;
    articleId?: string;
    type?: string;
    title?: string;
    contentHtml?: string;
    publishOn?: Date | string;
    lastModified?: Date | string;
    status?: string | null;
    isExclusive?: boolean | null;
    metered?: boolean | null;
    commentCount?: number;
    images?: Record<string, BinaryType>;
    canonicalUrl?: string | null;
    tickers?: string[];
    createdAt?: Date | string;
}

// ✅ Define return type
interface CryptoNewsResult {
    id: string;
    title: string;
    summary: string;
    url: string;
    source: string;
    publishedAt: Date | string | null;
    imageUrl: string | null;
}

export async function fetchCryptoNews(limit = 12, skip = 0) {
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("news");

    const [docs, total] = await Promise.all([
        col
            .find({})
            .sort({ publishOn: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        col.countDocuments({})
    ]);

    return {
        news: docs.map((d): CryptoNewsResult => ({
            id: d._id?.toString() ?? "",
            title: d.title ?? "",
            summary: d.contentHtml ?? "", // Using contentHtml as summary
            url: d.canonicalUrl ?? `https://seekingalpha.com/article/${d.articleId}`,
            source: d.source ?? "seeking-alpha",
            publishedAt: d.publishOn ?? null,
            imageUrl: d.images && typeof d.images === 'object'
                ? Object.values(d.images)[0] ?? null
                : null,
        })),
        total
    };
}