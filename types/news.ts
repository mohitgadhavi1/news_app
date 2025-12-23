export interface NewsItem {
    id: string;
    articleId?: string;
    source: string;
    type?: string;
    title: string;
    summary: string;
    contentHtml?: string;
    url: string;
    publishedAt: Date | string | null;
    lastModified?: Date | string | null;
    imageUrl: string | null;
    images?: Record<string, BinaryType>;
    status?: string | null;
    isExclusive?: boolean | null;
    metered?: boolean | null;
    commentCount?: number;
    tickers?: string[];
    createdAt?: Date | string;
}