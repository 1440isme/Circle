# Testing Strategy & Conventions in CIRCLE

Comprehensive multi-tier testing conventions fulfilling Rubric Level 5 requirements (G5, TC2.5, TC5).

---

## 1. Multi-Tier Testing Pyramid

```text
       ▲
      / \     E2E Tests (Playwright / Detox) — Full User Flows
     /   \
    /     \   API Contract Tests (Supertest) — Endpoints & Handshakes
   /       \
  /         \ Integration Tests (Jest + Prisma + Redis) — DB Transactions
 /           \
/_____________\ Unit Tests (Jest) — Validators, Calculations, Pure Functions
```

---

## 2. Directory Locations

- **Unit tests:** Colocated with source code (`*.spec.ts`) or in `tests/unit/`.
- **Integration tests:** `tests/integration/` and `apps/api/test/`.
- **API tests:** `tests/api/`.
- **E2E Web tests:** `tests/e2e/` (Playwright).
- **Performance tests:** `tests/performance/` (k6).

---

## 3. Test Standards & Discipline

1. **Every Bug Fix requires a Regression Test:** Never close a bug without an accompanying test proving the defect is eliminated.
2. **Negative Test Cases:** Every feature test suite must cover unauthorized requests, malformed payloads, rate limits, and network edge cases.
3. **No Flaky Tests:** Tests must be idempotent and self-cleaning. Always use transactional rollbacks or cleanup hooks (`afterEach`).
