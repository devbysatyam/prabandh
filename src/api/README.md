# api

Framework-agnostic request handling shared by the Vercel functions in `/api` and the Vite dev server.

- `handler.ts` validates the request (method, size, content type), applies rate and size limits from `security.ts`, then dispatches to `handlers/<route>.ts`.
- Each handler validates input with Zod, calls Gemini through `handlers/gemini.ts` (server-side key only, ADR 0003) and **always** has a deterministic local fallback (`localIntake.ts`, `ideasDefaults.ts`, engine `localAnswer`), see ADR 0002.
- Errors are constant machine-readable codes (for example `PAYLOAD_TOO_LARGE`), never raw upstream text.
- Untrusted text is fenced with `lib/sanitize.ts` before it reaches a prompt.
