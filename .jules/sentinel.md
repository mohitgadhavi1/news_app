## 2025-05-15 - [BSON Error via Malformed ObjectId]
**Vulnerability:** Passing an unvalidated string ID to `new ObjectId(id)` can throw a BSON error, potentially causing a crash or leaking internal details.
**Learning:** Even with TypeScript types, runtime validation is required at the boundary between user input and internal services/databases.
**Prevention:** Always use `ObjectId.isValid(id)` before instantiation.
