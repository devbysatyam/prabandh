# Contributing to Prabandh · प्रबंध

We welcome contributions to Prabandh! Please follow these standards:

1. **Branching & Commits**: Write clean commit messages following Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`).
2. **Deterministic Logic**: Place all pure calculations in `src/engine/`. Never put arithmetic inside React components.
3. **No Legacy References**: Keep code and docs strictly aligned with Prabandh branding.
4. **Verification**: Always run `npm test` and `npm run typecheck` before submitting pull requests.
5. **Quality gates**: `npm run typecheck && npm run lint && npm run format:check && npm test` must pass (CI runs them plus `npm run build`). ESLint is type-aware; fix violations rather than disabling rules, and keep any unavoidable `eslint-disable` to one line with a reason.
6. **Code structure**: keep files under ~400 lines. Split large components into a folder (subcomponents, hooks, pure `helpers.ts`, `constants.ts`) with an `index` re-export. Avoid `any` and non-null assertions, use named constants instead of magic numbers, add JSDoc to exported functions, and use `import type` for type-only imports.
7. **Accessibility & security**: preserve ARIA roles/labels, `lang` spans and the tests in `tests/ui/accessibility.test.tsx` and `tests/api/security.test.ts`.
