import { handleAuthCallback, getBasicUserFromUrlOrToken } from '../lib/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn(),
  },
});

const RealURLSearchParams = URLSearchParams;

describe('Auth Security Hardening', () => {
  let mockSearchParamsValue = '';

  beforeAll(() => {
    // Intercept URLSearchParams constructor
    global.URLSearchParams = jest.fn().mockImplementation((init) => {
        return new RealURLSearchParams(init || mockSearchParamsValue);
    }) as unknown as typeof URLSearchParams;
  });

  afterAll(() => {
    global.URLSearchParams = RealURLSearchParams;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockSearchParamsValue = '';
  });

  describe('handleAuthCallback', () => {
    it('should successfully store valid token and uid', () => {
      const validToken = 'a'.repeat(30) + '.' + 'b'.repeat(30) + '.' + 'c'.repeat(30);
      const params = new RealURLSearchParams();
      params.set('token', validToken);
      params.set('uid', 'user123');
      params.set('expiresAt', '1234567890');
      mockSearchParamsValue = params.toString();

      const result = handleAuthCallback();

      expect(result?.token).toBe(validToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_token', validToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('zidbit_user_uid', 'user123');
      expect(localStorage.setItem).toHaveBeenCalledWith('zidbit_auth_expiry', '1234567890');
    });

    it('should reject token that is too short', () => {
      const params = new RealURLSearchParams();
      params.set('token', 'short');
      params.set('uid', 'user123');
      mockSearchParamsValue = params.toString();

      const result = handleAuthCallback();
      expect(result).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should reject token that is too long', () => {
      const longToken = 'a'.repeat(5000);
      const params = new RealURLSearchParams();
      params.set('token', longToken);
      params.set('uid', 'user123');
      mockSearchParamsValue = params.toString();

      const result = handleAuthCallback();
      expect(result).toBeNull();
    });

    it('should reject overly long uid', () => {
        const longUid = 'u'.repeat(200);
        const validToken = 'a'.repeat(30) + '.' + 'b'.repeat(30) + '.' + 'c'.repeat(30);
        const params = new RealURLSearchParams();
        params.set('token', validToken);
        params.set('uid', longUid);
        mockSearchParamsValue = params.toString();

        handleAuthCallback();
        // It should NOT have stored the long UID (based on implementation logic)
        expect(localStorage.setItem).not.toHaveBeenCalledWith('zidbit_user_uid', longUid);
    });
  });

  describe('getBasicUserFromUrlOrToken', () => {
    it('should enforce length limits on URL parameters', () => {
      const longName = 'N'.repeat(300);
      const longEmail = 'E'.repeat(300);
      const validToken = 'a'.repeat(30) + '.' + 'b'.repeat(30) + '.' + 'c'.repeat(30);
      const params = new RealURLSearchParams();
      params.set('token', validToken);
      params.set('name', longName);
      params.set('email', longEmail);
      mockSearchParamsValue = params.toString();

      const user = getBasicUserFromUrlOrToken();

      expect(user?.name?.length).toBe(255);
      expect(user?.email?.length).toBe(255);
    });

    it('should safely decode JWT with 3 segments and support Unicode', () => {
      // Payload: {"name": "Jules 🛡️", "email": "sentinel@zidbit.com", "uid": "123"}
      const payloadObj = { name: "Jules 🛡️", email: "sentinel@zidbit.com", uid: "123" };
      const payloadStr = JSON.stringify(payloadObj);
      const payloadBase64 = Buffer.from(payloadStr).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const token = `header.${payloadBase64}.signature`;

      const user = getBasicUserFromUrlOrToken(token);

      expect(user?.name).toBe("Jules 🛡️");
      expect(user?.email).toBe("sentinel@zidbit.com");
    });

    it('should reject JWT with incorrect segment count', () => {
      const malformedToken = 'segment1.segment2';
      const user = getBasicUserFromUrlOrToken(malformedToken);
      expect(user).toBeNull();
    });

    it('should reject malicious javascript: picture URLs', () => {
        const validToken = 'a'.repeat(30) + '.' + 'b'.repeat(30) + '.' + 'c'.repeat(30);
        const params = new RealURLSearchParams();
        params.set('token', validToken);
        params.set('picture', 'javascript:alert(1)');
        mockSearchParamsValue = params.toString();

        const user = getBasicUserFromUrlOrToken();
        expect(user?.picture).toBeUndefined();
    });
  });
});
