import { handleAuthCallback, getBasicUserFromUrlOrToken } from '../lib/auth';

describe('Auth Security', () => {
    let mockReplaceState: jest.Mock;
    let mockGet: jest.Mock;

    beforeAll(() => {
        if (typeof (global as any).TextDecoder === 'undefined') {
            const { TextDecoder, TextEncoder } = require('util');
            (global as any).TextDecoder = TextDecoder;
            (global as any).TextEncoder = TextEncoder;
        }

        mockGet = jest.fn();
        (global as any).URLSearchParams = jest.fn().mockImplementation(() => ({
            get: mockGet
        }));

        mockReplaceState = jest.fn();
        Object.defineProperty(window.history, 'replaceState', {
            value: mockReplaceState,
            writable: true,
            configurable: true
        });
    });

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('handleAuthCallback', () => {
        it('should accept valid token and store it', () => {
            const token = 'a'.repeat(32);
            mockGet.mockImplementation((key) => {
                if (key === 'token') return token;
                if (key === 'expiresAt') return '1234567890';
                if (key === 'uid') return 'user123';
                return null;
            });

            const result = handleAuthCallback();

            expect(result?.token).toBe(token);
            expect(localStorage.getItem('zidbit_auth_token')).toBe(token);
            expect(localStorage.getItem('zidbit_auth_expiry')).toBe('1234567890');
            expect(localStorage.getItem('zidbit_user_uid')).toBe('user123');
        });

        it('should reject token that is too short', () => {
            const token = 'short';
            mockGet.mockImplementation((key) => {
                if (key === 'token') return token;
                return null;
            });

            const result = handleAuthCallback();

            expect(result).toBeNull();
            expect(localStorage.getItem('zidbit_auth_token')).toBeNull();
        });

        it('should reject token that is too long', () => {
            const token = 'a'.repeat(4097);
            mockGet.mockImplementation((key) => {
                if (key === 'token') return token;
                return null;
            });

            const result = handleAuthCallback();

            expect(result).toBeNull();
            expect(localStorage.getItem('zidbit_auth_token')).toBeNull();
        });
    });

    describe('getBasicUserFromUrlOrToken', () => {
        it('should decode a valid JWT payload', () => {
            const payload = { email: 'test@example.com', name: 'Test User', uid: '123' };
            const token = `header.${btoa(JSON.stringify(payload))}.signature`;

            const user = getBasicUserFromUrlOrToken(token);

            expect(user?.email).toBe(payload.email);
            expect(user?.name).toBe(payload.name);
            expect(user?.uid).toBe(payload.uid);
        });

        it('should handle Base64URL characters in JWT', () => {
            const payload = { email: 'test@example.com', name: 'A?B' };
            const base64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            const token = `header.${base64}.signature`;

            const user = getBasicUserFromUrlOrToken(token);

            expect(user?.name).toBe('A?B');
        });

        it('should handle Unicode characters in JWT', () => {
            const payload = { email: 'unicode@example.com', name: 'Jules 🛡️' };
            const json = JSON.stringify(payload);
            const bytes = new TextEncoder().encode(json);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const token = `header.${base64}.signature`;

            const user = getBasicUserFromUrlOrToken(token);

            expect(user?.name).toBe('Jules 🛡️');
        });

        it('should cap field lengths', () => {
            const longName = 'n'.repeat(300);
            const payload = { email: 'e'.repeat(300), name: longName, uid: 'u'.repeat(200) };
            const token = `header.${btoa(JSON.stringify(payload))}.signature`;

            const user = getBasicUserFromUrlOrToken(token);

            expect(user?.name?.length).toBe(255);
            expect(user?.email?.length).toBe(255);
            expect(user?.uid?.length).toBe(128);
        });
    });
});
