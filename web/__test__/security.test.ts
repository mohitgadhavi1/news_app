
// Mock variables must start with 'mock' to be used in jest.mock() and are hoisted
const mockFind = jest.fn().mockReturnValue({
    project: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
});
const mockCountDocuments = jest.fn().mockResolvedValue(0);
const mockEstimatedDocumentCount = jest.fn().mockResolvedValue(0);
const mockAggregate = jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([]),
});

// Mock ObjectId to avoid bson ESM issue
jest.mock('mongodb', () => ({
    ObjectId: jest.fn().mockImplementation((id) => ({
        toString: () => id || 'fake-id',
        isValid: () => true
    })),
}));

jest.mock('@/lib/mongodb', () => {
    // We can't reference mock variables directly here if they are not defined in this scope
    // But Jest hoists jest.mock and variables starting with 'mock'
    return {
        getDb: jest.fn().mockResolvedValue({
            collection: jest.fn().mockReturnValue({
                find: jest.fn().mockReturnValue({
                    project: jest.fn().mockReturnThis(),
                    sort: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    toArray: jest.fn().mockResolvedValue([]),
                }),
                countDocuments: jest.fn().mockResolvedValue(0),
                estimatedDocumentCount: jest.fn().mockResolvedValue(0),
                aggregate: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue([]),
                }),
            }),
        }),
    };
});

import { mapDocumentToResult, extractFirstImage, fetchCryptoNews, fetchCategoryCounts } from '@/lib/newsService';
import { getDb } from '@/lib/mongodb';

describe('Security: newsService protections', () => {
    let mockCol: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const db = await getDb();
        mockCol = (db.collection as jest.Mock)();
    });

    describe('mapDocumentToResult', () => {
        it('should NOT allow javascript: protocol in canonicalUrl', () => {
            const maliciousDoc = {
                _id: 'fake-id' as unknown as never,
                title: 'Malicious Article',
                canonicalUrl: 'javascript:alert("xss")',
                source: 'test-source'
            };

            const result = mapDocumentToResult(maliciousDoc);

            // Should be empty after fix
            expect(result.url).toBe('');
            expect(result.canonicalUrl).toBe('');
        });

        it('should allow https: protocol in canonicalUrl', () => {
            const safeDoc = {
                _id: 'fake-id' as unknown as never,
                title: 'Safe Article',
                canonicalUrl: 'https://example.com/safe',
                source: 'test-source'
            };

            const result = mapDocumentToResult(safeDoc);

            expect(result.url).toBe('https://example.com/safe');
        });
    });

    describe('extractFirstImage', () => {
        it('should NOT allow javascript: protocol in images', () => {
            const maliciousImages = {
                primary: 'javascript:alert("image-xss")'
            };

            const result = extractFirstImage(maliciousImages);

            expect(result).toBeNull();
        });

        it('should allow http: and https: protocols', () => {
            const safeImages = {
                primary: 'https://example.com/image.jpg'
            };
            const result = extractFirstImage(safeImages);
            expect(result).toBe('https://example.com/image.jpg');
        });

        it('should allow data: images', () => {
            const dataImage = {
                primary: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
            };
            const result = extractFirstImage(dataImage);
            expect(result).toBe(dataImage.primary);
        });
    });

    describe('fetchCryptoNews: NoSQL Injection protection', () => {
        it('should ignore non-string categoryName to prevent query operator injection', async () => {
            const maliciousCategory = { $ne: null } as unknown as string;
            await fetchCryptoNews(10, 0, maliciousCategory);
            expect(mockCol.find).toHaveBeenCalledWith({});
        });

        it('should use string categoryName correctly', async () => {
            await fetchCryptoNews(10, 0, 'AI');
            expect(mockCol.find).toHaveBeenCalledWith({ "category.categoryName": 'AI' });
        });
    });

    describe('fetchCategoryCounts: Prototype Pollution protection', () => {
        it('should NOT allow prototype pollution via malicious category names', async () => {
            mockCol.aggregate().toArray.mockResolvedValueOnce([
                { _id: 'AI', count: 5 },
                { _id: '__proto__', count: 100 },
                { _id: 'constructor', count: 50 }
            ]);

            const counts = await fetchCategoryCounts();

            expect(counts['AI']).toBe(5);
            expect(counts['__proto__']).toBeUndefined();
            expect(counts['constructor']).toBeUndefined();
            expect(Object.getPrototypeOf(counts)).toBeNull();
        });
    });
});
