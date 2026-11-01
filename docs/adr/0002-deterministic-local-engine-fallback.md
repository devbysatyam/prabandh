# ADR 0002: Deterministic local engine with AI as an optional layer

- Status: Accepted
- Date: 2026-11-02

## Context

Event planning involves money and deadlines. LLM output is non-deterministic, can be wrong, and is unavailable offline or without an API key.

## Decision

All arithmetic, rounding, scheduling and rules run in the pure `src/engine` module. Gemini is limited to language tasks (intake parsing, quote extraction, Q&A, ideas). Every AI route has a deterministic local fallback (`localParseIntake`, `localExtractQuote`, `localAnswer`, default ideas) that is used when the key is missing, the call fails, times out, or returns output that fails Zod validation.

## Consequences

- The product works fully offline and in tests with no network.
- AI can never change a rupee amount or a date; it only proposes values that are validated and shown to the user.
- Two code paths must be kept in step; shared Zod schemas and contract tests guard the response shape.
- Fallback quality is lower than the model for free-form text, which is an accepted trade-off.
