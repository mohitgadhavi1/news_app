# Bolt's Journal

## 2025-05-15 - [Database Index and Count Optimization]
**Learning:** For high-traffic news feeds, compound indexes on `(FilterField + SortField)` (following the ESR rule: Equality, Sort, Range) are critical to avoid O(N log N) in-memory sorts. Additionally, `countDocuments({})` on large collections can be a hidden bottleneck; `estimatedDocumentCount()` provides an O(1) alternative for total counts.
**Action:** Always verify query patterns in the service layer against index definitions in the persistence layer. Prefer `estimatedDocumentCount()` when a full collection count is needed for pagination.

## 2026-03-17 - [SSR for Sanitized HTML]
**Learning:** Client-side only HTML sanitization (using `ssr: false` for `dompurify`) blocks SSR for article content, hurting FCP and SEO. Using `isomorphic-dompurify` allows for server-side sanitization and full SSR of news content.
**Action:** Prefer `isomorphic-dompurify` over `dompurify` in Next.js projects to enable SSR for user-generated or external HTML content. Components rendering sanitized HTML should use standard imports to ensure the content is part of the initial HTML payload.

## 2026-03-20 - [MongoDB Projection and API Caching]
**Learning:** Fetching entire documents when only a few fields are needed is a common but expensive anti-pattern. MongoDB projection (`.project()`) significantly reduces network overhead and application memory usage. Additionally, static or time-based caching (`revalidate`) on heavy aggregation endpoints (like category counts) prevents redundant database load.
**Action:** Always use `.project()` to specify required fields in MongoDB queries. Implement `export const revalidate = X;` in Next.js API routes for data that doesn't change on every request.

## 2025-05-20 - [Efficient Date Formatting]
**Learning:** The `Intl` API (`toLocaleDateString`, `toLocaleString`) is surprisingly heavy when used inside the render loop of large lists (like news feeds). It creates significant overhead and can cause hydration mismatches if not handled carefully.
**Action:** Use manual string building for simple date formats in performance-critical components. Pre-formatting dates in the service layer or using lightweight utilities in `utils.ts` can drastically reduce rendering time per item.

## 2026-04-21 - [Server-Side Data Pre-processing]
**Learning:** Offloading string computations (initials, date formatting) and HTML sanitization to the server significantly reduces client-side JS execution and hydration time. Additionally, generating a plain-text summary from HTML on the server reduces the RSC payload size by avoiding sending large HTML strings twice (once as raw content and once as "summary").
**Action:** Always pre-process display data in the service/mapping layer on the server. Defer rendering of complex UI components (like sanitized HTML blocks) until they are actually needed by the user.

## 2025-05-22 - [Optimizing String Processing on Large Payloads]
**Learning:** Performing global regex operations (like tag stripping) on large strings (e.g., 500KB HTML) is a significant CPU bottleneck on the server. Taking a small slice of the string (e.g., 2000 chars) before running summary-extraction regexes reduces complexity from O(N) to O(1) relative to total content size.
**Action:** Always truncate or slice large strings to the minimum required length before applying multiple regex replacements or complex string manipulations.
