import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { isValidUrl, isValidImageUrl, formatSimpleDate, formatFullDateTime } from "./utils";
import DOMPurify from "isomorphic-dompurify";

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
    publishedAtFull: string | null;
    initials: string;
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

    // ✅ Security: Harden inputs to prevent NoSQL injection, DoS, and memory exhaustion
    const numLimit = Number(limit);
    const validatedLimit = (isNaN(numLimit) || numLimit <= 0) ? 12 : Math.min(100, numLimit);
    const numSkip = Number(skip);
    const validatedSkip = (isNaN(numSkip) || numSkip <= 0) ? 0 : Math.min(6000, numSkip);
    const validatedCategory = (typeof categoryName === 'string' && categoryName.length < 100)
        ? categoryName
        : undefined;

    const query = validatedCategory ? { "category.categoryName": validatedCategory } : {};

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
            .skip(validatedSkip)
            .limit(validatedLimit)
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

    // ✅ Security: Use Object.create(null) and validate keys to prevent prototype pollution from DB data
    return counts.reduce((acc, curr) => {
        const key = String(curr._id);
        if (key !== "__proto__" && key !== "constructor" && key !== "prototype") {
            acc[key] = curr.count;
        }
        return acc;
    }, Object.create(null) as Record<string, number>);
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
    const rawContent = doc.content ?? doc.contentHtml ?? "";
    const canonicalUrl = doc.canonicalUrl ?? "";
    const validatedUrl = isValidUrl(canonicalUrl) ? canonicalUrl : "";

    // ⚡ Bolt Optimization: Pre-calculate initials on the server
    const initials = (doc.title ?? "")
        .replace(/[0-9]/g, '')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join('');

    // ⚡ Bolt Optimization: Sanitize HTML on the server and create a plain-text summary
    // to reduce RSC payload size and client-side processing.
    const sanitizedContent = DOMPurify.sanitize(rawContent);
    const summary = sanitizedContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 280);

    return {
        id: doc._id?.toString() ?? "",
        title: doc.title ?? "",
        summary: summary,
        content: sanitizedContent,
        url: validatedUrl,
        source: doc.source ?? "seeking-alpha",
        publishedAt: formatSimpleDate(doc.publishOn),
        publishedAtFull: formatFullDateTime(doc.publishOn),
        initials,
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
