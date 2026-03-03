# Bolt's Journal

## 2025-05-15 - [Database Index and Count Optimization]
**Learning:** For high-traffic news feeds, compound indexes on `(FilterField + SortField)` (following the ESR rule: Equality, Sort, Range) are critical to avoid O(N log N) in-memory sorts. Additionally, `countDocuments({})` on large collections can be a hidden bottleneck; `estimatedDocumentCount()` provides an O(1) alternative for total counts.
**Action:** Always verify query patterns in the service layer against index definitions in the persistence layer. Prefer `estimatedDocumentCount()` when a full collection count is needed for pagination.
