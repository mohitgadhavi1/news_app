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
