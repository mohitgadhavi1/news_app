
// Mock ObjectId to avoid bson ESM issue
jest.mock('mongodb', () => ({
    ObjectId: jest.fn().mockImplementation((id) => ({
        toString: () => id || 'fake-id',
        isValid: () => true
    })),
}));

import { mapDocumentToResult, extractFirstImage } from '@/lib/newsService';

describe('Security: URL Validation in newsService', () => {
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
});
