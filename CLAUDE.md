# CLAUDE.md — Prabandh · प्रबंध (Celebration & Event Planning Platform)

You are building **Prabandh (प्रबंध)**, a connected, AI-assisted event planning platform designed for Indian families.

---

## 1. Product Thesis

"One plan, everything connected." Event planning is an interconnected graph:
- Guest count drives catering headcount and plates.
- Budget allocation drives vendor sourcing and trade-offs.
- Venue date drives the milestone timeline and payments.

Prabandh maintains a **single source of truth** plan object. Any modification immediately recalculates the budget, timeline, vendor checklist, and warnings with deterministic precision.

- **Deterministic Engine**: Does 100% of arithmetic, rounding, timeline scheduling, and unit economics.
- **Gemini AI**: Strictly language parsing (intake text, vendor quotes, family Q&A copilot, theme ideas).
- **Integrity**: Never invents vendor pricing or hallucinates fake availability.

---

## 2. Technical Commandments

- **Stack**: Vite + React 18 + TypeScript (Strict, noUncheckedIndexedAccess) + Tailwind CSS.
- **Serverless**: Vercel Serverless Functions in `/api`.
- **Validation**: Strict Zod schemas in `src/schemas/`.
- **Integer Math**: Money is stored as integer rupees. Proportions round via Largest Remainder (Hare-Niemeyer).
- **Testing**: Run `npm test` and `npm run typecheck` before pushing. Maintain 100% engine test coverage.
