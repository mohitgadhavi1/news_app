import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { isValidUrl, isValidImageUrl, formatSimpleDate } from "./utils";

// ✅ Fixed document interface
interface CryptoNewsDocument {
    _id?: ObjectId;
    source?: string;
    articleId?: string;
    type?: string;
    title?: string;
    content?: string;
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
    category?: {
        categoryName?: string;
    };
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
    isExclusive: boolean;
    tickers: string[];
    commentCount: number;
    images?: Record<string, string>;
    canonicalUrl?: string | null;
}

export async function fetchCryptoNews(limit = 12, skip = 0, categoryName?: string) {
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("external_news");

    const query = categoryName ? { "category.categoryName": categoryName } : {};

    const [docs, total] = await Promise.all([
        col
            .find(query)
            .project({
                _id: 1,
                title: 1,
                content: 1,
                contentHtml: 1,
                canonicalUrl: 1,
                source: 1,
                publishOn: 1,
                images: 1,
                "category.categoryName": 1,
                isExclusive: 1,
                tickers: 1,
                commentCount: 1
            })
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
    // ✅ Security: Validate ObjectId format to prevent BSON errors or potential injection attempts
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    const col = db.collection<CryptoNewsDocument>("external_news");

    const doc = await col.findOne({ _id: new ObjectId(id) });
    return doc ? mapDocumentToResult(doc) : null;
}

export function mapDocumentToResult(doc: CryptoNewsDocument): CryptoNewsResult {
    const content = doc.content ?? doc.contentHtml ?? "";
    const canonicalUrl = doc.canonicalUrl ?? "";
    const validatedUrl = isValidUrl(canonicalUrl) ? canonicalUrl : "";

    return {
        id: doc._id?.toString() ?? "",
        title: doc.title ?? "",
        summary: content,
        content: content,
        url: validatedUrl,
        source: doc.source ?? "seeking-alpha",
        publishedAt: formatSimpleDate(doc.publishOn),
        imageUrl: extractFirstImage(doc.images),
        categoryName: doc.category?.categoryName ?? null,
        isExclusive: doc.isExclusive ?? false,
        tickers: doc.tickers ?? [],
        commentCount: doc.commentCount ?? 0,
        images: doc.images,
        canonicalUrl: validatedUrl,
    };
}

export function extractFirstImage(images: Record<string, string> | undefined): string | null {
    if (!images || typeof images !== 'object') return null;
    const firstImage = Object.values(images)[0];
    return isValidImageUrl(firstImage) ? firstImage : null;
}
