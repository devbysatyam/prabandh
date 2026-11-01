# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Developer tooling: husky pre-commit (lint-staged: eslint --fix and prettier) and commit-msg (commitlint, Conventional Commits) hooks.
- Scripts: `knip` (dead code), `dup` (jscpd copy/paste detection), `docs:api` (typedoc into `docs/api`) and `size` (gzip bundle budget).
- ESLint `complexity` (max 10), `max-depth` (max 4) and `max-lines-per-function` (80 for logic, 150 warning for JSX components).
- CI: bundle-size budget step, dead-code / duplication job and a Playwright end-to-end job.
- Dependabot for npm and GitHub Actions (weekly, grouped).
- Architecture Decision Records (`docs/adr`), module READMEs and TSDoc (`@param`, `@returns`, `@example`) across engine, lib and state.

### Changed

- Refactored high-complexity functions (local intake parser, advisor, analytics, timeline sort, reducers, navigation badges, timeline task rows, venue card) into small named helpers without behaviour changes.

### Removed

- Unused `openExternal` helper, `ChatMessage` schema and `PriorityId` type; generated `coverage/` output.

## [1.0.0]

### Added

- Prabandh: connected celebration planning for Indian families: budget with largest-remainder allocation and trade-off solver, venues and site visits, vendors and quote comparison, guests and RSVPs, dependency-aware timeline, day-of run sheet, analytics and Gemini-assisted intake with deterministic local fallbacks.
