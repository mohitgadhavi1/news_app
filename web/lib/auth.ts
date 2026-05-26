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

        // ✅ Security: Strict length limits and validation of parameters
        // JWT tokens are usually > 100 chars, but we'll be safe with 21-4096.
        // UID and expiresAt are also capped to prevent DoS via large localStorage entries.
        if (token && typeof token === 'string' && token.length > 20 && token.length <= 4096) {
            localStorage.setItem(TOKEN_KEY, token);

            if (expiresAt && !isNaN(Number(expiresAt)) && expiresAt.length < 32) {
                localStorage.setItem(EXPIRY_KEY, expiresAt);
            }

            if (uid && typeof uid === 'string' && uid.length > 0) {
                if (uid.length <= 128) {
                    localStorage.setItem(UID_KEY, uid);
                } else {
                    return null;
                }
            }

            // Clean URL
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            return { token, expiresAt, uid };
        }
    } catch (err) {
        console.error("Auth callback handling failed:", err);
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
    } catch (err) {
        console.error("Failed to retrieve stored auth:", err);
        return { token: null, expiresAt: null, uid: null };
    }
}

export function logout() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        localStorage.removeItem(UID_KEY);
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    } catch (err) {
        console.error("Logout failed:", err);
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
            const token = urlParams.get("token") || providedToken || getStoredAuth().token || undefined;
            const email = urlParams.get("email")?.substring(0, 255);
            const name = urlParams.get("name")?.substring(0, 255);
            const rawPicture = urlParams.get("picture");
            const picture = isValidImageUrl(rawPicture) ? rawPicture : undefined;
            const uid = (urlParams.get("uid") || getStoredAuth().uid)?.substring(0, 128);

            if (token && (email || name || picture || uid)) {
                return { email, name, picture, uid };
            }
        } catch (err) {
            console.error("Failed to parse basic user from URL:", err);
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    if (token && typeof token === 'string' && token.split('.').length === 3) {
        try {
            // ✅ Security: Robust JWT payload extraction with Unicode support and segment validation
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const pad = base64.length % 4;
            const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;
            const jsonPayload = decodeURIComponent(
                atob(paddedBase64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            const payload = JSON.parse(jsonPayload);

            const picture = isValidImageUrl(payload.picture) ? payload.picture : undefined;
            return {
                email: (payload.email || "Details unavailable").substring(0, 255),
                name: (payload.name || "Unknown User").substring(0, 255),
                picture,
                uid: String(payload.user_id || payload.uid || "Unknown").substring(0, 128),
            };
        } catch (err) {
            console.error("JWT decoding failed:", err);
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