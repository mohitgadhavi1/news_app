# Zidbit Auth Service - Login Integration Guide

This auth service acts as a central login provider for Zidbit applications.

## 1. Redirecting to Login

To authenticate a user, redirect them to the Auth Service URL with a `redirect` query parameter.

**Auth URL:** `https://auth.zidbit.com/` (or `http://localhost:8080/`)

### JavaScript Example:
```javascript
const authUrl = "https://auth.zidbit.com/";
const redirectUrl = window.location.origin + "/callback"; // Your protected page
window.location.href = `${authUrl}?redirect=${encodeURIComponent(redirectUrl)}`;
```

---

## 2. Handling the Redirect Back

After successful login, the Auth Service redirects back to your `redirect` URL with the following parameters:
- `token`: The Firebase ID token.
- `expiresAt`: ISO 8601 string of token expiration time.
- `issuedAt`: ISO 8601 string of token issuance time.
- `uid`: The unique user ID.

### JavaScript Example:
```javascript
// Extract parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const expiresAt = urlParams.get('expiresAt');
const uid = urlParams.get('uid');

if (token) {
    // Save token for future API calls
    localStorage.setItem('zidbit_auth_token', token);
    localStorage.setItem('zidbit_auth_expiry', expiresAt);
    localStorage.setItem('zidbit_user_uid', uid);
    
    // Clean URL (remove parameters from address bar)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log("Logged in successfully!");
}
```

---

## 3. Using the Token

Include the token in the `Authorization` header of your API requests to backend services.

### Header Format:
`Authorization: Bearer <YOUR_TOKEN_HERE>`

---

## 4. Security Requirements (Whitelist)

The redirect URL's domain must be whitelisted in the Auth Service.
- **Allowed Domains:** `localhost`, `zidbit.com` (and all subdomains).
- To add more domains, update the `src/config/domains.ts` file in the Auth Service backend or use the `ALLOWED_REDIRECT_ORIGINS` environment variable.

---

## 5. Getting User Info

To get the authenticated user's details, make a GET request to the `/me` endpoint with the token.

### API Endpoint:
`GET https://auth.zidbit.com/me` (or `http://localhost:8080/me`)

### JavaScript Example:
```javascript
const token = localStorage.getItem('zidbit_auth_token');

fetch('https://auth.zidbit.com/me', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json())
.then(userData => {
    console.log("User Info:", userData);
    // userData contains: uid, email, name, picture, role, etc.
})
.catch(error => console.error('Error fetching user info:', error));
```

### Response Example:
```json
{
  "uid": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "role": "user",
  "permissions": [],
  "createdAt": "2024-02-16T12:00:00.000Z",
  "lastLoginAt": "2024-02-16T12:00:00.000Z",
  "exp": 1708084800,
  "iat": 1708081200
}
```
