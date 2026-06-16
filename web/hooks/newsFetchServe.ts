import { CryptoNewsResult, fetchCryptoNews } from "../lib/newsService";


const ITEMS_PER_PAGE = 12;

// ✅ Use the correct return type from fetchCryptoNews
interface NewsFetchResult {
    news: CryptoNewsResult[]; // Match the type from fetchCryptoNews
    totalCount: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    skip: number;
}

export async function newsFetchServe(page: number, categoryName?: string): Promise<NewsFetchResult> {
    // ✅ Security: Ensure page is a positive integer and capped to avoid negative skip or DoS via large offsets
    const MAX_PAGES = 500;
    const validatedPage = Math.min(MAX_PAGES, Math.max(1, Math.floor(page || 1)));
    const skip = (validatedPage - 1) * ITEMS_PER_PAGE;


    // ✅ Let errors throw naturally for Next.js error boundaries to catch
    // ⚡ Bolt Optimization: Use isSnippet=true to reduce RSC payload and server-side CPU load
    // for news list views, as full content is only needed for the article detail page.
    const result = await fetchCryptoNews(ITEMS_PER_PAGE, skip, categoryName, true);

    const totalPages = Math.ceil(result.total / ITEMS_PER_PAGE);

    return {
        skip,
        itemsPerPage: ITEMS_PER_PAGE, // Changed to camelCase
        news: result.news,
        totalCount: result.total,
        totalPages,
        currentPage: page,
    };
}