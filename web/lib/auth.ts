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
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expiresAt = urlParams.get('expiresAt');
    const uid = urlParams.get('uid');

    // ✅ Security: Strict length limits to prevent DoS via massive URL parameters
    const isValidToken = typeof token === 'string' && token.length >= 21 && token.length <= 4096;
    const isValidExpires = !expiresAt || (typeof expiresAt === 'string' && expiresAt.length < 32 && !isNaN(Number(expiresAt)));
    const isValidUid = !uid || (typeof uid === 'string' && uid.length >= 1 && uid.length <= 128);

    if (isValidToken && isValidExpires && isValidUid) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
            if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt);
            if (uid) localStorage.setItem(UID_KEY, uid);
        } catch (e) {
            console.error("Auth callback: Failed to save to localStorage", e);
        }

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return { token, expiresAt, uid };
    }
    return null;
}

export function getStoredAuth() {
    if (typeof window === 'undefined') {
        return { token: null, expiresAt: null, uid: null };
    }
    try {
        return {
            token: localStorage.getItem(TOKEN_KEY),
            expiresAt: localStorage.getItem(EXPIRY_KEY),
            uid: localStorage.getItem(UID_KEY),
        };
    } catch (e) {
        console.error("Failed to get auth from localStorage", e);
        return { token: null, expiresAt: null, uid: null };
    }
}

export function logout() {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRY_KEY);
            localStorage.removeItem(UID_KEY);
        } catch (e) {
            console.error("Logout: Failed to clear localStorage", e);
        }
        window.location.reload();
    }
}

/**
 * Extracts basic user info from URL parameters or a stored/provided JWT.
 * Useful for immediate UI display before the full /me request completes or as a fallback.
 */
export function getBasicUserFromUrlOrToken(providedToken?: string) {
    if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token") || providedToken || getStoredAuth().token || undefined;
        // ✅ Security: Cap URL parameter lengths to prevent DoS/Memory exhaustion
        const email = urlParams.get("email")?.substring(0, 255) || null;
        const name = urlParams.get("name")?.substring(0, 255) || null;
        const rawPicture = urlParams.get("picture");
        const picture = isValidImageUrl(rawPicture) ? rawPicture : undefined;
        const uid = urlParams.get("uid")?.substring(0, 255) || getStoredAuth().uid;

        if (token && (email || name || picture || uid)) {
            return { email, name, picture, uid };
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    if (token && typeof token === 'string') {
        try {
            const segments = token.split(".");
            if (segments.length !== 3) throw new Error("Invalid JWT segments");

            // ✅ Security: Unicode-safe Base64URL decoding with padding
            const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
            const pad = base64.length % 4;
            const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
            const payload = JSON.parse(decodeURIComponent(atob(padded).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));

            const picture = isValidImageUrl(payload.picture) ? payload.picture : undefined;
            return {
                email: (typeof payload.email === 'string' ? payload.email.substring(0, 255) : null) || "Details unavailable",
                name: (typeof payload.name === 'string' ? payload.name.substring(0, 255) : null) || "Unknown User",
                picture,
                uid: (typeof payload.user_id === 'string' ? payload.user_id.substring(0, 255) :
                    typeof payload.uid === 'string' ? payload.uid.substring(0, 255) : null) || "Unknown",
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