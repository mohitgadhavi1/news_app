
jest.mock('../lib/newsService', () => ({
    fetchCryptoNews: jest.fn(),
}));
import { newsFetchServe } from '@/hooks/newsFetchServe';

// Mock the database layer



import { fetchCryptoNews } from '../lib/newsService';
const mockFetchCryptoNews = fetchCryptoNews as jest.MockedFunction<typeof fetchCryptoNews>;

describe('News Service Layer', () => {
    const mockNewsData = {
        news: [
            {
                id: '1',
                title: 'Bitcoin News',
                summary: 'Bitcoin summary',
                url: 'https://example.com/bitcoin',
                source: 'CoinDesk',
                publishedAt: '2024-01-15',
                imageUrl: 'https://example.com/img1.jpg',
            },
            {
                id: '2',
                title: 'Ethereum News',
                summary: 'Ethereum summary',
                url: 'https://example.com/eth',
                source: 'CryptoNews',
                publishedAt: '2024-01-14',
                imageUrl: null,
            },
        ],
        total: 25,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetchCryptoNews.mockResolvedValue(mockNewsData);
    });

    describe('Pagination Logic', () => {
        it('should calculate skip correctly for page 1', async () => {
            await newsFetchServe(1);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 0, undefined);
        });

        it('should calculate skip correctly for page 2', async () => {
            await newsFetchServe(2);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 12, undefined);
        });

        it('should calculate skip correctly for page 5', async () => {
            await newsFetchServe(5);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 48, undefined);
        });

        it('should default to page 1 when no page provided', async () => {
            await newsFetchServe(1);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 0, undefined);
        });

        it('should calculate total pages correctly', async () => {
            const result = await newsFetchServe(1);

            expect(result.totalPages).toBe(3); // 25 / 12 = 2.08... = 3 pages
        });

        it('should handle exact page boundary', async () => {
            mockFetchCryptoNews.mockResolvedValue({
                ...mockNewsData,
                total: 24, // Exactly 2 pages
            });

            const result = await newsFetchServe(1);

            expect(result.totalPages).toBe(2);
        });

        it('should handle single page', async () => {
            mockFetchCryptoNews.mockResolvedValue({
                ...mockNewsData,
                total: 10, // Less than page size
            });

            const result = await newsFetchServe(1);

            expect(result.totalPages).toBe(1);
        });

        it('should handle zero results', async () => {
            mockFetchCryptoNews.mockResolvedValue({
                news: [],
                total: 0,
            });

            const result = await newsFetchServe(1);

            expect(result.totalPages).toBe(0);
        });
    });

    describe('Return Structure', () => {
        it('should return all required fields', async () => {
            const result = await newsFetchServe(2);

            expect(result).toHaveProperty('news');
            expect(result).toHaveProperty('totalCount');
            expect(result).toHaveProperty('totalPages');
            expect(result).toHaveProperty('currentPage');
            expect(result).toHaveProperty('itemsPerPage');
            expect(result).toHaveProperty('skip');
        });

        it('should return correct current page', async () => {
            const result = await newsFetchServe(3);

            expect(result.currentPage).toBe(3);
        });

        it('should return correct skip value', async () => {
            const result = await newsFetchServe(3);

            expect(result.skip).toBe(24); // (3-1) * 12
        });

        it('should return correct items per page', async () => {
            const result = await newsFetchServe(1);

            expect(result.itemsPerPage).toBe(12);
        });

        it('should pass through news data unchanged', async () => {
            const result = await newsFetchServe(1);

            expect(result.news).toEqual(mockNewsData.news);
        });

        it('should return total count from database', async () => {
            const result = await newsFetchServe(1);

            expect(result.totalCount).toBe(25);
        });
    });

    describe('Error Handling', () => {
        it('should propagate database errors', async () => {
            const dbError = new Error('Database connection failed');
            mockFetchCryptoNews.mockRejectedValue(dbError);

            await expect(newsFetchServe(1)).rejects.toThrow('Database connection failed');
        });

        it('should handle invalid page numbers by defaulting to 1', async () => {
            // Page 0 should be treated as 1
            await newsFetchServe(0);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 0, undefined);
        });

        it('should handle negative page numbers by defaulting to 1', async () => {
            await newsFetchServe(-1);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 0, undefined);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large page numbers', async () => {
            await newsFetchServe(1000);

            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 11988, undefined);
        });

        it('should handle page number as float by floor validation', async () => {
            await newsFetchServe(2.5);

            // Should calculate skip based on floor(2.5) = 2
            expect(mockFetchCryptoNews).toHaveBeenCalledWith(12, 12, undefined);
        });

        it('should handle large total counts', async () => {
            mockFetchCryptoNews.mockResolvedValue({
                ...mockNewsData,
                total: 10000,
            });

            const result = await newsFetchServe(1);

            expect(result.totalPages).toBe(834); // 10000 / 12 = 833.33... = 834
        });
    });
});