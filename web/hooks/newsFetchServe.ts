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
    const skip = (page - 1) * ITEMS_PER_PAGE;


    // ✅ Let errors throw naturally for Next.js error boundaries to catch
    const result = await fetchCryptoNews(ITEMS_PER_PAGE, skip, categoryName);

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