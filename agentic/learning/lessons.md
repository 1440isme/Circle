# Lessons Learned

Post-mortems, bug analyses, and root-cause takeaways.

---

## Lesson 01: Avoid Direct SQL Strings in Dynamic Filters
- **Problem:** Dynamic filtering by circle tags or member status constructed through raw string concatenation introduces SQL injection risks.
- **Root Cause:** Bypassing Prisma's type-safe `where` builder.
- **Resolution:** Strictly use Prisma's nested `where` clauses with input validated by class-validator DTOs.

## Lesson 02: Socket Event Storms on Disconnection
- **Problem:** When a client disconnected abruptly, 100+ socket clients received repeated connection status updates.
- **Root Cause:** Broadcasting presence without debouncing rapid reconnection attempts.
- **Resolution:** Implemented a 5-second debounce window in Redis for user offline status broadcast.
