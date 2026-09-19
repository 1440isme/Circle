# Skill: Run Tests

Multi-tier automated test execution in CIRCLE across backend, web, and mobile.

---

## When to Use
- Before opening a PR or declaring a feature implementation complete.
- During local debugging and regression testing.

---

## Commands

### 1. Backend Tests (`apps/backend` or `apps/api`)
```bash
# Unit tests
npm run test --prefix apps/backend

# Integration / e2e tests
npm run test:e2e --prefix apps/backend

# Test coverage
npm run test:cov --prefix apps/backend
```

### 2. Web Tests (`apps/web`)
```bash
# Component and unit tests
npm run test --prefix apps/web

# Playwright E2E tests
npx playwright test
```

### 3. Mobile Tests (`apps/mobile`)
```bash
# Jest unit and component tests
npm run test --prefix apps/mobile
```

### 4. Integrity Check
```bash
# Verify no broken links across agentic and doc files
./scripts/check-agent-map.sh
```

---

## Guardrails
- Never skip failing tests (`.skip` or `fit`) to pass CI.
- Never fake test assertions (`expect(true).toBe(true)`).
