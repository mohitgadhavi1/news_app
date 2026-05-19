import { handleAuthCallback, getBasicUserFromUrlOrToken } from '../lib/auth';

jest.mock('../lib/utils', () => ({
    isValidImageUrl: jest.fn().mockImplementation((url) => {
        return url && (url.startsWith('http') || url.startsWith('data:'));
    }),
}));

describe('auth.ts hardening', () => {
    let localStorageStore: Record<string, string> = {};

    beforeAll(() => {
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => localStorageStore[key] || null),
                setItem: jest.fn((key, value) => {
                    localStorageStore[key] = value.toString();
                }),
                removeItem: jest.fn((key) => {
                    delete localStorageStore[key];
                }),
                clear: jest.fn(() => {
                    localStorageStore = {};
                }),
            },
            writable: true
        });

        // Mock history.replaceState
        Object.defineProperty(window.history, 'replaceState', {
            value: jest.fn(),
            writable: true
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageStore = {};
        // Use history.pushState to change the URL without navigation
        window.history.pushState({}, '', '/callback');
    });

    describe('handleAuthCallback', () => {
        it('should enforce length limits on token', () => {
            const longToken = 'a'.repeat(5000);
            window.history.pushState({}, '', `/callback?token=${longToken}&uid=123&expiresAt=123456`);

            const result = handleAuthCallback();
            expect(result).toBeNull();
            expect(window.localStorage.setItem).not.toHaveBeenCalledWith('zidbit_auth_token', longToken);
        });

        it('should enforce length limits on uid', () => {
            const longUid = 'u'.repeat(200);
            const token = 'a'.repeat(32);
            window.history.pushState({}, '', `/callback?token=${token}&uid=${longUid}&expiresAt=123456`);

            handleAuthCallback();
            expect(window.localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_token', token);
            expect(window.localStorage.setItem).not.toHaveBeenCalledWith('zidbit_user_uid', longUid);
        });

        it('should accept valid parameters', () => {
            const token = 'a'.repeat(32);
            window.history.pushState({}, '', `/callback?token=${token}&uid=user123&expiresAt=123456789`);

            const result = handleAuthCallback();
            expect(result).toEqual({ token, uid: 'user123', expiresAt: '123456789' });
            expect(window.localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_token', token);
            expect(window.localStorage.setItem).toHaveBeenCalledWith('zidbit_user_uid', 'user123');
            expect(window.localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_expiry', '123456789');
        });
    });

    describe('getBasicUserFromUrlOrToken', () => {
        it('should enforce length limits on email and name from URL', () => {
            const token = 'a'.repeat(32);
            const longEmail = 'e'.repeat(300) + '@example.com';
            const longName = 'n'.repeat(300);
            // Include a valid small UID so that some field is validated and non-null
            window.history.pushState({}, '', `/callback?token=${token}&email=${longEmail}&name=${longName}&uid=123`);

            const result = getBasicUserFromUrlOrToken();
            expect(result).not.toBeNull();
            expect(result?.email).toBe(null);
            expect(result?.name).toBe(null);
            expect(result?.uid).toBe('123');
        });

        it('should decode JWT safely and enforce limits', () => {
            // Header: {"alg":"HS256","typ":"JWT"}
            const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
            // Payload: {"email":"test@example.com","name":"Test User","uid":"123"}
            const payload = btoa(JSON.stringify({
                email: 'test@example.com',
                name: 'Test User',
                uid: '123'
            })).replace(/=/g, '');
            const signature = 'fake-signature';
            const token = `${header}.${payload}.${signature}`;

            const result = getBasicUserFromUrlOrToken(token);
            expect(result).toEqual({
                email: 'test@example.com',
                name: 'Test User',
                picture: undefined,
                uid: '123'
            });
        });

        it('should return null for malformed JWT (less than 3 segments)', () => {
            const result = getBasicUserFromUrlOrToken('not.a.jwt');
            // 'not.a.jwt' has 3 segments if split by '.'
            // Let's try something else
            expect(getBasicUserFromUrlOrToken('not.jwt')).toBeNull();
        });

        it('should handle invalid base64 in JWT safely', () => {
            const token = 'header.invalid_base64_!@#$%^.signature';
            const result = getBasicUserFromUrlOrToken(token);
            expect(result).toEqual({
                email: "Details unavailable",
                name: "Unknown User",
                picture: undefined,
                uid: "Unknown",
            });
        });
    });
});
