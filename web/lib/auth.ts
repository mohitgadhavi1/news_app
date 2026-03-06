// Zidbit Auth integration utility
// Handles login redirect, callback, token storage, and user info fetch

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
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        if (expiresAt) localStorage.setItem(EXPIRY_KEY, expiresAt);
        if (uid) localStorage.setItem(UID_KEY, uid);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return { token, expiresAt, uid };
    }
    return null;
}

export function getStoredAuth() {
    return {
        token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
        expiresAt: typeof window !== 'undefined' ? localStorage.getItem(EXPIRY_KEY) : null,
        uid: typeof window !== 'undefined' ? localStorage.getItem(UID_KEY) : null,
    };
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(UID_KEY);
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
        const picture = urlParams.get("picture");
        const uid = urlParams.get("uid") || getStoredAuth().uid;

        if (token && (email || name || picture || uid)) {
            return { email, name, picture, uid };
        }
    }

    // Try to decode JWT for email/name/picture
    const token = providedToken || getStoredAuth().token;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return {
                email: payload.email || "Details unavailable",
                name: payload.name || "Unknown User",
                picture: payload.picture || undefined,
                uid: payload.user_id || payload.uid || "Unknown",
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