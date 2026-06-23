// Zidbit Auth integration utility
// Handles login redirect, callback, token storage, and user info fetch
import { isValidImageUrl } from "./utils";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.zidbit.com/";
const ME_URL = (AUTH_URL.endsWith("/") ? AUTH_URL : AUTH_URL + "/") + "me";
const TOKEN_KEY = "zidbit_auth_token";
const EXPIRY_KEY = "zidbit_auth_expiry";
const UID_KEY = "zidbit_user_uid";

// ✅ Security: Enforce strict length limits to prevent DoS and memory exhaustion
const MAX_TOKEN_LENGTH = 4096;
const MAX_UID_LENGTH = 128;
const MAX_FIELD_LENGTH = 255;

/**
 * Unicode-safe Base64URL decoding with padding support.
 * Prevents errors with non-padded tokens and correctly handles UTF-8 characters.
 */
function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    return decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

export function redirectToLogin() {
    const redirectUrl = window.location.origin + "/callback";
    window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(redirectUrl)}`;
}

export function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expiresAt = urlParams.get('expiresAt');
    const uid = urlParams.get('uid');

    // ✅ Security: Basic validation of parameters and length checks
    if (token && typeof token === 'string' && token.length >= 21 && token.length <= MAX_TOKEN_LENGTH) {
        try {
            localStorage.setItem(TOKEN_KEY, token);

            if (expiresAt && !isNaN(Number(expiresAt)) && expiresAt.length < 32) {
                localStorage.setItem(EXPIRY_KEY, expiresAt);
            }

            if (uid && typeof uid === 'string' && uid.length > 0 && uid.length <= MAX_UID_LENGTH) {
                localStorage.setItem(UID_KEY, uid);
            }
        } catch (e) {
            console.error("Failed to store auth credentials in localStorage", e);
        }

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return { token, expiresAt, uid };
    }
    return null;
}

export function getStoredAuth() {
    if (typeof window === 'undefined') return { token: null, expiresAt: null, uid: null };
    try {
        return {
            token: localStorage.getItem(TOKEN_KEY),
            expiresAt: localStorage.getItem(EXPIRY_KEY),
            uid: localStorage.getItem(UID_KEY),
        };
    } catch {
        return { token: null, expiresAt: null, uid: null };
    }
}

export function logout() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        localStorage.removeItem(UID_KEY);
    } catch { }
    window.location.reload();
}

/**
 * Extracts basic user info from URL parameters or a stored/provided JWT.
 * Useful for immediate UI display before the full /me request completes or as a fallback.
 */
export function getBasicUserFromUrlOrToken(providedToken?: string) {
    if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const rawToken = urlParams.get("token") || providedToken || getStoredAuth().token || undefined;
        const token = (rawToken && rawToken.length <= MAX_TOKEN_LENGTH) ? rawToken : undefined;

        const email = urlParams.get("email")?.substring(0, MAX_FIELD_LENGTH);
        const name = urlParams.get("name")?.substring(0, MAX_FIELD_LENGTH);
        const rawPicture = urlParams.get("picture");
        const picture = (rawPicture && rawPicture.length <= 2048 && isValidImageUrl(rawPicture)) ? rawPicture : undefined;
        const uid = (urlParams.get("uid") || getStoredAuth().uid)?.substring(0, MAX_UID_LENGTH);

        if (token && (email || name || picture || uid)) {
            return { email, name, picture, uid };
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    if (token && token.length <= MAX_TOKEN_LENGTH) {
        const segments = token.split(".");
        // ✅ Security: Ensure JWT has exactly 3 segments before processing
        if (segments.length === 3) {
            try {
                const payload = JSON.parse(base64UrlDecode(segments[1]));
                const rawPicture = payload.picture;
                const picture = (rawPicture && rawPicture.length <= 2048 && isValidImageUrl(rawPicture)) ? rawPicture : undefined;
                return {
                    email: String(payload.email || "Details unavailable").substring(0, MAX_FIELD_LENGTH),
                    name: String(payload.name || "Unknown User").substring(0, MAX_FIELD_LENGTH),
                    picture,
                    uid: String(payload.user_id || payload.uid || "Unknown").substring(0, MAX_UID_LENGTH),
                };
            } catch {
                // fall through to default
            }
        }
    }

    const auth = getStoredAuth();
    if (auth.token) {
        return {
            email: "Details unavailable",
            name: "Unknown User",
            picture: undefined,
            uid: auth.uid?.substring(0, MAX_UID_LENGTH) || "Unknown",
        };
    }

    return null;
}

export interface ZidbitUser {
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    uid?: string | null;
    lastLoginAt?: string | number;
    iat?: number;
    exp?: number;
    error?: string;
}

export async function fetchUserInfo(token?: string) {
    token = token || getStoredAuth().token || undefined;
    if (!token || token.length > MAX_TOKEN_LENGTH) return null;
    try {
        const res = await fetch(ME_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch {
        // CORS or network error - don't leak internals
        return { error: "Failed to fetch user info" };
    }
}
