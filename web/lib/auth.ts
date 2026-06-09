// Zidbit Auth integration utility
// Handles login redirect, callback, token storage, and user info fetch
import { isValidImageUrl } from "./utils";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.zidbit.com/";
const ME_URL = (AUTH_URL.endsWith("/") ? AUTH_URL : AUTH_URL + "/") + "me";
const TOKEN_KEY = "zidbit_auth_token";
const EXPIRY_KEY = "zidbit_auth_expiry";
const UID_KEY = "zidbit_user_uid";

export function redirectToLogin() {
    const redirectUrl = window.location.origin + "/callback";
    window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(redirectUrl)}`;
}

export function handleAuthCallback() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const expiresAt = urlParams.get('expiresAt');
        const uid = urlParams.get('uid');

        // ✅ Security: Strict validation and length limits for parameters
        if (token && typeof token === 'string' && token.length >= 21 && token.length <= 4096) {
            localStorage.setItem(TOKEN_KEY, token);

            if (expiresAt && typeof expiresAt === 'string' && expiresAt.length < 32 && !isNaN(Number(expiresAt))) {
                localStorage.setItem(EXPIRY_KEY, expiresAt);
            }

            if (uid && typeof uid === 'string' && uid.length > 0 && uid.length <= 128) {
                localStorage.setItem(UID_KEY, uid);
            }

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return { token, expiresAt, uid };
        }
    } catch (e) {
        console.error("Auth callback error:", e);
    }
    return null;
}

export function getStoredAuth() {
    try {
        return {
            token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
            expiresAt: typeof window !== 'undefined' ? localStorage.getItem(EXPIRY_KEY) : null,
            uid: typeof window !== 'undefined' ? localStorage.getItem(UID_KEY) : null,
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
        window.location.reload();
    } catch (e) {
        console.error("Logout error:", e);
    }
}

/**
 * Extracts basic user info from URL parameters or a stored/provided JWT.
 * Useful for immediate UI display before the full /me request completes or as a fallback.
 */
export function getBasicUserFromUrlOrToken(providedToken?: string) {
    if (typeof window !== "undefined") {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const rawToken = urlParams.get("token") || providedToken || getStoredAuth().token || undefined;
            const token = (rawToken && rawToken.length <= 4096) ? rawToken : undefined;

            const email = urlParams.get("email")?.substring(0, 255);
            const name = urlParams.get("name")?.substring(0, 255);
            const rawPicture = urlParams.get("picture");
            const picture = (rawPicture && rawPicture.length <= 2048 && isValidImageUrl(rawPicture)) ? rawPicture : undefined;
            const uid = (urlParams.get("uid") || getStoredAuth().uid)?.substring(0, 128);

            if (token && (email || name || picture || uid)) {
                return { email, name, picture, uid };
            }
        } catch (e) {
            console.error("Error extracting basic user info:", e);
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    if (token && typeof token === 'string' && token.length <= 4096) {
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return null;

            // Robust Base64URL decoding with padding
            let base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            while (base64Payload.length % 4 !== 0) base64Payload += "=";

            // Unicode-safe decoding
            const binaryString = atob(base64Payload);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const payload = JSON.parse(new TextDecoder().decode(bytes));

            const picture = isValidImageUrl(payload.picture) ? payload.picture : undefined;
            return {
                email: (payload.email?.toString().substring(0, 255)) || "Details unavailable",
                name: (payload.name?.toString().substring(0, 255)) || "Unknown User",
                picture,
                uid: (payload.user_id || payload.uid || "Unknown").toString().substring(0, 128),
            };
        } catch {
            return {
                email: "Details unavailable",
                name: "Unknown User",
                picture: undefined,
                uid: "Unknown",
            };
        }
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
    if (!token) return null;
    try {
        const res = await fetch(ME_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        // CORS or network error
        return { error: e instanceof Error ? e.message : String(e) };
    }
}