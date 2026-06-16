
import { handleAuthCallback, getBasicUserFromUrlOrToken } from '../lib/auth';

describe('Auth Security', () => {
  let locationSearch = '';
  const RealURLSearchParams = global.URLSearchParams;

  beforeAll(() => {
    (global as any).URLSearchParams = jest.fn().mockImplementation((search) => {
        return new RealURLSearchParams(search || locationSearch);
    });

    (window as any).history = {
      replaceState: jest.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
      configurable: true
    });
  });

  afterAll(() => {
    global.URLSearchParams = RealURLSearchParams;
  });

  beforeEach(() => {
    locationSearch = '';
    jest.clearAllMocks();
  });

  function setUrlSearch(search: string) {
    locationSearch = search;
  }

  describe('handleAuthCallback', () => {
    it('should reject tokens that are too short', () => {
      setUrlSearch('?token=short-token');
      const result = handleAuthCallback();
      expect(result).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should reject tokens that are too long', () => {
      setUrlSearch('?token=' + 'a'.repeat(4097));
      const result = handleAuthCallback();
      expect(result).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should accept valid tokens', () => {
      const validToken = 'a'.repeat(30);
      setUrlSearch(`?token=${validToken}`);
      const result = handleAuthCallback();
      expect(result?.token).toBe(validToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_token', validToken);
    });

    it('should reject invalid expiresAt', () => {
      setUrlSearch(`?token=${'a'.repeat(30)}&expiresAt=not-a-number`);
      const result = handleAuthCallback();
      expect(result).toBeNull();
    });

    it('should reject overly long expiresAt', () => {
        setUrlSearch(`?token=${'a'.repeat(30)}&expiresAt=${'1'.repeat(33)}`);
        const result = handleAuthCallback();
        expect(result).toBeNull();
    });

    it('should reject overly long uid', () => {
        setUrlSearch(`?token=${'a'.repeat(30)}&uid=${'u'.repeat(129)}`);
        const result = handleAuthCallback();
        expect(result).toBeNull();
    });
  });

  describe('getBasicUserFromUrlOrToken', () => {
    it('should cap URL parameters to 255 characters', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const longName = 'b'.repeat(300);
      setUrlSearch(`?token=${'a'.repeat(30)}&email=${longEmail}&name=${longName}`);

      const result = getBasicUserFromUrlOrToken();
      expect(result?.email?.length).toBe(255);
      expect(result?.name?.length).toBe(255);
    });

    it('should handle robust JWT decoding', () => {
      const payload = { email: "test@example.com", name: "Test User", uid: "123" };
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "");
      const token = `header.${encodedPayload}.signature`;

      const result = getBasicUserFromUrlOrToken(token);
      expect(result?.email).toBe("test@example.com");
      expect(result?.name).toBe("Test User");
      expect(result?.uid).toBe("123");
    });

    it('should handle Unicode in JWT payload', () => {
        const payload = { name: "Tést Üser" };
        const json = JSON.stringify(payload);
        const encodedPayload = btoa(unescape(encodeURIComponent(json))).replace(/=/g, "");
        const token = `header.${encodedPayload}.signature`;

        const result = getBasicUserFromUrlOrToken(token);
        expect(result?.name).toBe("Tést Üser");
    });

    it('should fail gracefully on malformed JWT', () => {
      const token = "malformed.jwt";
      const result = getBasicUserFromUrlOrToken(token);
      expect(result?.name).toBe("Unknown User");
    });
  });

  describe('localStorage resilience', () => {
    it('should handle localStorage failure in handleAuthCallback', () => {
        (localStorage.setItem as jest.Mock).mockImplementation(() => { throw new Error("quota exceeded"); });
        const validToken = 'a'.repeat(30);
        setUrlSearch(`?token=${validToken}`);

        // Should not throw
        const result = handleAuthCallback();
        expect(result?.token).toBe(validToken);
    });
  });
});
