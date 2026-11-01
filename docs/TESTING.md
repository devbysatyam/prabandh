# Testing Strategy & Quality Assurance — Prabandh · प्रबंध

Prabandh employs a multi-tiered test suite covering deterministic engines, schema validation, API contracts, user interactions, and end-to-end flows.

---

## 1. Test Architecture

```
tests/
  api/          # Backend serverless handlers, fallback parsers & Gemini integrations
  engine/       # Pure arithmetic, largest remainder rounding, timelines, analytics
  schemas/      # Zod schema validation & boundary constraints
  quality/      # Code hygiene, naming rules, zero leak tests
  ui/           # Component interactions, state transitions, accessible buttons
e2e/            # Playwright end-to-end user journeys
```

---

## 2. Testing Execution

- **Run all unit & engine tests**:

  ```bash
  npm test
  ```

- **Run typecheck with strict flags**:

  ```bash
  npm run typecheck
  ```

- **Run test coverage**:

  ```bash
  npm run coverage
  ```

- **Run Playwright E2E tests**:
  ```bash
  npm run e2e
  ```

---

## 3. Coverage Standards

- **100% pure function coverage** in `src/engine/` (`money.ts`, `budget.ts`, `timeline.ts`, `guests.ts`, `venues.ts`, `vendors.ts`, `analytics.ts`).
- Zero tolerance for unchecked null or undefined access.
- Every API route is tested with both AI-available scenarios and deterministic local fallback scenarios.
