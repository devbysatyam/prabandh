# lib

Small, dependency-free helpers shared by the client and the serverless code.

- `api.ts`: typed `fetch` client for `/api/*` (30 s timeout, same-origin, safe error codes).
- `sanitize.ts`: control-character stripping, length clamping, prompt-injection fencing, CSV formula-injection defence, phone / URL / mailto builders and the external-host allow-list.
- `ids.ts`: client-side id generation.

Everything exported here is documented with TSDoc (`@param`, `@returns`, `@example`).
