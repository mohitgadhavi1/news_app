
import { handleAuthCallback, getBasicUserFromUrlOrToken, getStoredAuth, logout } from '../lib/auth';

describe('Auth Security and Resilience', () => {
    const originalLocalStorage = window.localStorage;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mocking localStorage
        const mockStorage: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockStorage[key] || null),
                setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
                removeItem: jest.fn((key) => { delete mockStorage[key]; }),
                clear: jest.fn(() => { for (const key in mockStorage) delete mockStorage[key]; }),
            },
            configurable: true,
            writable: true
        });

        // Reset URL between tests
        window.history.pushState({}, '', '/');
    });

    afterAll(() => {
        Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    });

    describe('handleAuthCallback', () => {
        it('should accept valid parameters', () => {
            const url = new URL('http://localhost/callback');
            url.searchParams.set('token', 'A'.repeat(32));
            url.searchParams.set('expiresAt', '1234567890');
            url.searchParams.set('uid', 'user123');
            window.history.pushState({}, '', url.toString());

            const result = handleAuthCallback();
            expect(result).not.toBeNull();
            expect(localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_token', 'A'.repeat(32));
        });

        it('should reject overly long tokens', () => {
            const url = new URL('http://localhost/callback');
            url.searchParams.set('token', 'A'.repeat(5000));
            window.history.pushState({}, '', url.toString());
            const result = handleAuthCallback();
            expect(result).toBeNull();
        });

        it('should reject overly short tokens', () => {
            const url = new URL('http://localhost/callback');
            url.searchParams.set('token', 'A'.repeat(10));
            window.history.pushState({}, '', url.toString());
            const result = handleAuthCallback();
            expect(result).toBeNull();
        });

        it('should reject overly long uid', () => {
            const url = new URL('http://localhost/callback');
            url.searchParams.set('token', 'A'.repeat(32));
            url.searchParams.set('uid', 'U'.repeat(200));
            window.history.pushState({}, '', url.toString());
            const result = handleAuthCallback();
            expect(result).toBeNull();
        });
    });

    describe('getBasicUserFromUrlOrToken', () => {
        it('should cap parameter lengths from URL', () => {
            const longName = 'N'.repeat(300);
            const url = new URL('http://localhost/');
            url.searchParams.set('token', 'A'.repeat(32));
            url.searchParams.set('name', longName);
            window.history.pushState({}, '', url.toString());

            const user = getBasicUserFromUrlOrToken();
            expect(user?.name?.length).toBeLessThanOrEqual(255);
        });

        it('should return null for malformed JWT without URL params', () => {
            // If no URL params are present, it tries to decode the token.
            // If decoding fails, it should return default "Unknown" object if token exists.
            // Wait, my implementation returns the "Unknown" object if token is valid (has 3 segments).
            const malformedToken = 'abc.def'; // only 2 segments
            const user = getBasicUserFromUrlOrToken(malformedToken);
            expect(user).toBeNull();
        });

        it('should handle robust Unicode JWT payload', () => {
            const payload = { name: "Jules 🛡️", email: "sentinel@zidbit.com" };
            const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const token = `header.${encodedPayload}.signature`;

            const user = getBasicUserFromUrlOrToken(token);
            expect(user?.name).toBe("Jules 🛡️");
        });
    });

    describe('LocalStorage Resilience', () => {
        it('should not crash if localStorage throws', () => {
            (localStorage.getItem as jest.Mock).mockImplementation(() => { throw new Error('Security Error'); });
            (localStorage.setItem as jest.Mock).mockImplementation(() => { throw new Error('Security Error'); });

            expect(() => getStoredAuth()).not.toThrow();
            expect(() => logout()).not.toThrow();
        });
    });
});
