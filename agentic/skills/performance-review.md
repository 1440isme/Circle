# Skill: Performance Review

Profiling and optimizing latency, database queries, and client bundle size in CIRCLE.

---

## When to Use
- Reviewing endpoints against NFR quantitative goals (e.g. `NFR-001`: API p95 < 200ms).
- Before milestone evaluations.

---

## Steps

1. **Database Query Profiling:**
   - Turn on Prisma query logging: `log: ['query', 'info', 'warn', 'error']`.
   - Check for N+1 query patterns; use Prisma `include` or batch queries.
   - Verify index usage via `EXPLAIN ANALYZE` on heavy queries.
2. **Caching Strategy:**
   - Cache static or slow-changing reads (circle member lists, user profiles) in Redis with reasonable TTLs.
3. **Frontend Bundle Size:**
   - Run Next.js bundle analyzer: `@next/bundle-analyzer`.
   - Ensure dynamic imports for heavy components (e.g. WebRTC video stage, markdown editor).
4. **Realtime Debouncing:**
   - Debounce typing indicators and status updates to prevent socket flooding.
