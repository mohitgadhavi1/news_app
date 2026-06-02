import { handleAuthCallback, getBasicUserFromUrlOrToken } from '../lib/auth';

// Define mocks before anything else
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  setItem: jest.fn((key, val) => { mockStorage[key] = String(val); }),
  getItem: jest.fn((key) => mockStorage[key] || null),
  removeItem: jest.fn((key) => { delete mockStorage[key]; }),
  clear: jest.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }),
};

let mockSearch = '';
const historyMock = {
  replaceState: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });
Object.defineProperty(window, 'history', { value: historyMock, configurable: true });

// Completely replace URLSearchParams with a mock that we can control
const originalURLSearchParams = global.URLSearchParams;
global.URLSearchParams = jest.fn((search) => {
    return new originalURLSearchParams(mockSearch || search);
}) as any;

jest.mock('../lib/utils', () => ({
  isValidImageUrl: jest.fn((url) => !!url && (url.startsWith('http') || url.startsWith('data:'))),
}));

describe('Auth Security: validation and JWT handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockSearch = '';
  });

  const setLocationSearch = (search: string) => {
    mockSearch = search;
  };

  describe('handleAuthCallback', () => {
    it('should validate token length (min 21)', () => {
      setLocationSearch('?token=too-short&expiresAt=123&uid=456');
      const result = handleAuthCallback();
      expect(result).toBeNull();
    });

    it('should validate token length (max 4096)', () => {
      setLocationSearch(`?token=${'a'.repeat(4097)}&expiresAt=123&uid=456`);
      const result = handleAuthCallback();
      expect(result).toBeNull();
    });

    it('should validate expiresAt length (< 32)', () => {
      const validToken = 'a'.repeat(30);
      setLocationSearch(`?token=${validToken}&expiresAt=${'1'.repeat(33)}&uid=456`);
      const result = handleAuthCallback();
      expect(result).not.toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zidbit_auth_token', validToken);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('zidbit_auth_expiry', expect.any(String));
    });

    it('should validate uid length (max 128)', () => {
      const validToken = 'a'.repeat(30);
      setLocationSearch(`?token=${validToken}&expiresAt=123&uid=${'u'.repeat(129)}`);
      const result = handleAuthCallback();
      expect(result).not.toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zidbit_auth_token', validToken);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('zidbit_user_uid', expect.any(String));
    });

    it('should accept valid parameters', () => {
      const validToken = 'a'.repeat(30);
      setLocationSearch(`?token=${validToken}&expiresAt=1735689600&uid=user-123`);
      const result = handleAuthCallback();
      expect(result).toEqual({ token: validToken, expiresAt: '1735689600', uid: 'user-123' });
    });
  });

  describe('getBasicUserFromUrlOrToken', () => {
    it('should cap URL parameter lengths at 255 chars', () => {
      const longName = 'A'.repeat(500);
      const longEmail = 'E'.repeat(500) + '@example.com';
      const validToken = 'a'.repeat(30);
      setLocationSearch(`?token=${validToken}&name=${longName}&email=${longEmail}&uid=123`);

      const result = getBasicUserFromUrlOrToken();
      expect(result).not.toBeNull();
      expect(result?.name?.length).toBe(255);
      expect(result?.email?.length).toBe(255);
    });

    it('should handle JWT segment count verification (must be 3)', () => {
      const invalidJwt = 'header.payload';
      const result = getBasicUserFromUrlOrToken(invalidJwt);
      expect(result).toBeNull();
    });

    it('should handle robust Base64URL decoding with Unicode', () => {
      const payload = { name: 'Jules 🧪', email: 'jules@example.com', uid: '123' };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const jwt = `header.${base64Payload}.signature`;

      const result = getBasicUserFromUrlOrToken(jwt);
      expect(result?.name).toBe('Jules 🧪');
      expect(result?.email).toBe('jules@example.com');
    });

    it('should fail gracefully on malformed JWT payload', () => {
      const jwt = 'header.not-json.signature';
      const result = getBasicUserFromUrlOrToken(jwt);
      expect(result?.name).toBe('Unknown User');
      expect(result?.email).toBe('Details unavailable');
    });
  });
});
