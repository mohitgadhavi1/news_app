import { ObjectId } from 'mongodb';

/**
 * Represents a news article item as stored in the database.
 * Based on the reference schema image.
 */
export interface NewsItem {
    /** Unique identifier for the document in MongoDB */
    _id?: ObjectId | string;

    /** Unique identifier for the article from the source */
    articleId: string;

    /** The official canonical URL of the article */
    canonicalUrl: string | null;

    /** Number of comments on the article */
    commentCount: number;

    /** The main body content of the article */
    content: string;

    /** Timestamp when the record was first created in the database */
    createdAt: Date;

    /** Image assets associated with the news article */
    images: {
        /** The main/primary image for the article */
        primary: any;
        /** Alternative image versions or thumbnails */
        variants: any[];
    };

    /** Whether this article is exclusive to the source */
    isExclusive: boolean | null;

    /** Timestamp of the last modification to the article at the source */
    lastModified: Date;

    /** Whether the article is behind a paywall (metered) */
    metered: boolean | null;

    /** Timestamp when the article was originally published */
    publishOn: Date;

    /** The name or identifier of the news source */
    source: string;

    /** Current status of the article (e.g., 'published', 'archived') */
    status: string | null;

    /** List of stock tickers or keywords mentioned in the article */
    tickers: string[];

    /** The headline or title of the news article */
    title: string;

    /** The category or format of the news article (e.g., 'market-news') */
    type: string;

    /** Categorization details including AI classification metadata */
    category?: Category & {
        /** The name of the category assigned by the AI */
        categoryName: string;
        /** Confidence level of the AI classification (0.0 to 1.0) */
        confidence: number;
        /** Short explanation from the AI for the category choice */
        reasoning: string;
    };

    /** Timestamp of the last update made to this record in the database */
    updatedAt: Date;
}

/**
 * Represents a descriptive category for news items.
 */
export interface Category {
    name: string;
    desc: string;
    icon: string;
    color: string;
}
