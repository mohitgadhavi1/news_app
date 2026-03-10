# Sentinel Journal - Critical Security Learnings Only

## 2025-05-15 - Deep Pagination DoS Protection
**Vulnerability:** Unbounded pagination parameters (e.g., `page=1000000`) can cause a Denial of Service (DoS) by forcing the database to perform expensive skip operations (O(N)).
**Learning:** Even if individual document retrieval is fast, large offsets in MongoDB require the engine to scan and discard all preceding records, leading to resource exhaustion.
**Prevention:** Always implement a reasonable upper bound for pagination `page` and `limit` parameters to cap database load.
