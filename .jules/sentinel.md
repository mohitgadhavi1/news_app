## 2025-05-15 - [BSON Error via Malformed ObjectId]
**Vulnerability:** Passing an unvalidated string ID to `new ObjectId(id)` can throw a BSON error, potentially causing a crash or leaking internal details.
**Learning:** Even with TypeScript types, runtime validation is required at the boundary between user input and internal services/databases.
**Prevention:** Always use `ObjectId.isValid(id)` before instantiation.

## 2025-05-16 - [XSS via Unvalidated URL Schemes]
**Vulnerability:** URLs from external news sources and user profiles were rendered in `href` and `src` attributes without protocol validation, allowing XSS via `javascript:` schemes.
**Learning:** Sanitizing HTML (e.g., via DOMPurify) is not enough if the URL itself is used in an attribute where the browser can execute code.
**Prevention:** Always validate URL protocols at the data mapping layer using a whitelist (e.g., `http:`, `https:`, `data:` for images).

## 2025-05-17 - [NoSQL Injection and Prototype Pollution]
**Vulnerability:** Dynamic query filters were not type-checked, allowing object injection (NoSQLi). Aggregation results were reduced into objects without prototype protection, allowing malicious keys (Prototype Pollution).
**Learning:** Data from the database should be treated with caution similar to user input when used to build objects or as keys.
**Prevention:** Type-check query parameters at the service layer. Use `Object.create(null)` and filter keys like `__proto__` when building objects from dynamic data.

## 2025-05-18 - [DoS via Deep Paging and Resource Exhaustion]
**Vulnerability:** Unvalidated `limit` and `skip` parameters in news queries allowed "Deep Paging" and massive result sets, which could exhaust database resources and application memory (DoS).
**Learning:** Even if the UI limits pagination, the underlying API/Service layer must enforce strict bounds on resource-intensive parameters like MongoDB's `limit` and `skip`.
**Prevention:** Always validate and cap pagination parameters at the service layer. Implement reasonable upper bounds (e.g., limit=100, skip=6000).

## 2025-05-19 - [DoS via Large String Payloads and Connection Hanging]
**Vulnerability:** Lack of length limits on news content and URLs, combined with missing database timeouts, exposed the application to resource exhaustion (CPU/Memory) and process hanging.
**Learning:** External data (even from "trusted" news sources) can contain massive payloads that choke sanitization libraries (DOMPurify) or URL parsers. Missing DB timeouts can cause serverless functions or containers to hang indefinitely on network issues.
**Prevention:** Enforce strict length limits on all external strings before processing (e.g., 500k for content, 2k for URLs). Always configure `connectTimeoutMS` and `serverSelectionTimeoutMS` on database clients.

## 2025-05-20 - [Insecure Auth Parameter Handling and Brittle JWT Decoding]
**Vulnerability:** Lack of length limits on authentication parameters (tokens, UIDs) and brittle JWT decoding (using `atob` directly) exposed the app to DoS and potential crashes on malformed/Unicode input.
**Learning:** Authentication boundaries are high-value targets for resource exhaustion. `atob` alone is insufficient for JWT payloads which may contain Unicode characters or Base64URL encoding variants.
**Prevention:** Enforce strict length limits on all auth parameters. Use a robust, Unicode-safe decoding pattern (TextDecoder) and handle Base64URL character replacements and padding manually. Wrap all environment-dependent calls (localStorage, window) in try-catch blocks.
