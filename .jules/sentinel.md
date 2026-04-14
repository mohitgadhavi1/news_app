## 2025-05-15 - [BSON Error via Malformed ObjectId]
**Vulnerability:** Passing an unvalidated string ID to `new ObjectId(id)` can throw a BSON error, potentially causing a crash or leaking internal details.
**Learning:** Even with TypeScript types, runtime validation is required at the boundary between user input and internal services/databases.
**Prevention:** Always use `ObjectId.isValid(id)` before instantiation.

## 2025-05-16 - [XSS via Unvalidated URL Schemes]
**Vulnerability:** URLs from external news sources and user profiles were rendered in `href` and `src` attributes without protocol validation, allowing XSS via `javascript:` schemes.
**Learning:** Sanitizing HTML (e.g., via DOMPurify) is not enough if the URL itself is used in an attribute where the browser can execute code.
**Prevention:** Always validate URL protocols at the data mapping layer using a whitelist (e.g., `http:`, `https:`, `data:` for images).
