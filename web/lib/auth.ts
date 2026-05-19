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
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expiresAt = urlParams.get('expiresAt');
    const uid = urlParams.get('uid');

    // ✅ Security: Harden validation with length limits
    if (token && typeof token === 'string' && token.length > 20 && token.length < 4096) {
        try {
            localStorage.setItem(TOKEN_KEY, token);

            if (expiresAt && expiresAt.length < 32 && !isNaN(Number(expiresAt))) {
                localStorage.setItem(EXPIRY_KEY, expiresAt);
            }

            if (uid && typeof uid === 'string' && uid.length > 0 && uid.length < 128) {
                localStorage.setItem(UID_KEY, uid);
            }
        } catch (e) {
            console.error("Failed to store auth tokens in localStorage", e);
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
    if (typeof window === 'undefined') return;

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
        const token = urlParams.get("token") || providedToken || getStoredAuth().token || undefined;
        const email = urlParams.get("email");
        const name = urlParams.get("name");
        const rawPicture = urlParams.get("picture");

        // ✅ Security: Apply length limits to URL parameters
        const validatedEmail = (email && email.length < 255) ? email : null;
        const validatedName = (name && name.length < 255) ? name : null;
        const picture = (rawPicture && rawPicture.length < 2048 && isValidImageUrl(rawPicture)) ? rawPicture : undefined;
        const uid = urlParams.get("uid") || getStoredAuth().uid;
        const validatedUid = (uid && uid.length < 128) ? uid : null;

        if (token && (validatedEmail || validatedName || picture || validatedUid)) {
            return { email: validatedEmail, name: validatedName, picture, uid: validatedUid };
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    // ✅ Security: Verify JWT format and use safe Base64URL decoding
    if (token && typeof token === 'string' && token.split('.').length === 3) {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            const payload = JSON.parse(jsonPayload);
            const picture = (payload.picture && payload.picture.length < 2048 && isValidImageUrl(payload.picture))
                ? payload.picture
                : undefined;

            return {
                email: (payload.email && payload.email.length < 255) ? payload.email : "Details unavailable",
                name: (payload.name && payload.name.length < 255) ? payload.name : "Unknown User",
                picture,
                uid: (payload.sub || payload.user_id || payload.uid || "Unknown").substring(0, 128),
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