import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

// ✅ Fixed document interface
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
    images?: Record<string, string>;
    canonicalUrl?: string | null;
    tickers?: string[];
    createdAt?: Date | string;
}

export interface CryptoNewsResult {
    id: string;
    title: string;
    summary: string;
    content?: string;
    url: string;
    source: string;
    publishedAt: string | null;
    imageUrl: string | null;
    categoryName: string | null;
}

export async function fetchCryptoNews(limit = 12, skip = 0, categoryName?: string) {
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("external_news");

    const query = categoryName ? { "category.categoryName": categoryName } : {};

    const [docs, total] = await Promise.all([
        col
            .find(query)
            .sort({ publishOn: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        categoryName ? col.countDocuments(query) : col.estimatedDocumentCount()
    ]);

    return {
        news: docs.map(mapDocumentToResult),
        total
    };
}

export async function fetchCategoryCounts() {
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("external_news");

    const counts = await col.aggregate([
        { $match: { "category.categoryName": { $exists: true } } },
        { $group: { _id: "$category.categoryName", count: { $sum: 1 } } }
    ]).toArray();

    return counts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {} as Record<string, number>);
}

export async function fetchArticleById(id: string) {
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("external_news");

    const doc = await col.findOne({ _id: new ObjectId(id) });
    return doc ? mapDocumentToResult(doc) : null;
}

function mapDocumentToResult(doc: CryptoNewsDocument): CryptoNewsResult {
    return {
        id: doc._id?.toString() ?? "",
        title: doc.title ?? "",
        summary: (doc as any).content ?? doc.contentHtml ?? "", // Safely grab content since it's mapped in backend
        content: (doc as any).content ?? doc.contentHtml ?? "",
        url: doc.canonicalUrl ?? "",
        source: doc.source ?? "seeking-alpha",
        publishedAt: formatDate(doc.publishOn),
        imageUrl: extractFirstImage(doc.images),
        categoryName: (doc as any).category?.categoryName ?? null,
    };
}

function extractFirstImage(images: Record<string, string> | undefined): string | null {
    if (!images || typeof images !== 'object') return null;
    return Object.values(images)[0] ?? null;
}

function formatDate(item: string | Date | undefined): string | null {
    if (!item) return null;
    const d = new Date(item);
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}