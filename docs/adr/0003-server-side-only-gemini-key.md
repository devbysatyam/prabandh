# ADR 0003: Gemini API key lives only on the server

- Status: Accepted
- Date: 2026-11-02

## Context

Any key shipped in a Vite bundle is public. A leaked key can be abused for cost and content generation.

## Decision

The key is read from `GEMINI_API_KEY` only inside the Vercel functions (`/api/*`) and the Vite dev middleware; it is never prefixed `VITE_`. The browser calls same-origin `/api/*` endpoints that validate input, cap sizes, fence untrusted text against prompt injection (`lib/sanitize.ts`) and return only constant error codes. CI greps `dist/` for key-like strings and fails the build if one appears.

## Consequences

- The client bundle contains no secrets and the CSP `connect-src` stays on `self`.
- All AI traffic passes one hardened choke point where rate, size and schema limits are applied.
- Local development needs a `.env` with the key, or runs on the fallback engine (ADR 0002).
- Each AI request costs one extra hop through our function.
