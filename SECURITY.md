# Security Policy — Prabandh · प्रबंध

Prabandh is designed from first principles with defense-in-depth architecture, zero-trust input validation, and privacy-first local computation.

---

## Supported Versions

| Version |     Supported      | Security Maintenance Status |
| :------ | :----------------: | :-------------------------- |
| 1.0.x   | :white_check_mark: | Active Continuous Patching  |
| < 1.0.0 |        :x:         | Deprecated                  |

---

## Threat Model & Core Security Guarantees

### 1. Integer Financial Mathematics & Zero Floating-Point Drift

- **Invariant**: All financial allocations, plate costs, and rupee budgets are calculated using safe integer arithmetic (`Math.round`, `Math.floor`, integer paisa / rupee rounding).
- **Overflow Protection**: Budget amounts are validated against bounds `[₹10,000, ₹100,00,00,000]`. Extreme numbers, `NaN`, `Infinity`, or negative values are rejected at the schema level by Zod validators.
- **Zero Loss Principle**: Sum of categorized allocations always equals 100% of the total budget without rounding drift.

### 2. Zero Code Injection (`eval` / `Function` / `dangerouslySetInnerHTML`)

- **Static Analysis**: Prabandh prohibits `eval()`, `new Function()`, `setTimeout(string)`, and React `dangerouslySetInnerHTML`.
- **Gemini AI Copilot Output Sanitization**: AI-generated responses (JSON plans, quotation insights, negotiation advice) are strictly parsed through deterministic schemas and rendered as structured React components, preventing Cross-Site Scripting (XSS).

### 3. Serverless API Defense & DoS Mitigation (OWASP API Top 10 2023 / ASVS V4, V5, V13)

- **Strict Input Validation**: every route validates its body with a Zod schema (`src/api/security.ts`, `RequestSchemas`); full `Plan` payloads go through `PlanSchema`. Invalid input returns a constant `400 INVALID_REQUEST`.
- **Body Size Caps**: `256 KB` limit enforced via a `Content-Length` pre-check and a streaming byte counter (HTTP 413). Bodies must be valid JSON objects (no plain-text fallback).
- **Method & Content-Type Allow-list**: only `POST` with `application/json` (405 / 415 otherwise, `Allow: POST`).
- **Same-Origin Only (CORS)**: no CORS headers are emitted and cross-origin `Origin` headers are rejected (403), preventing cross-site API abuse.
- **Rate Limiting**: 30 requests/minute per client IP per route (429 + `Retry-After`) with bounded memory. Pair with the Vercel Firewall for distributed abuse.
- **Constant Error Shapes**: errors are `{ "error": "CODE" }` only. No messages, stack traces, request content or keys are returned or logged (`safeLog` records the error class only).
- **Upstream Timeouts**: Gemini calls are limited to 20 s and capped output tokens.
- **LLM Prompt-Injection Mitigation (OWASP LLM01/LLM02)**: untrusted text is stripped of control/bidi characters, length-capped, wrapped in `<user_text>` / `<plan_facts>` data fences whose delimiters cannot be forged, and preceded by a guard instruction. Model JSON output is re-validated with Zod; free-text output is sanitised and capped, and rendered only as React text nodes.
- **Header Hardening** (`vercel.json`):
  - `Content-Security-Policy`: `default-src 'none'`; `script-src 'self'` (no inline/eval); `connect-src 'self'` (Gemini is only reached server-side); `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`. Inline styles are allowed only as attributes (`style-src-attr`) for React style props.
  - `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY` (kept alongside `frame-ancestors` for legacy browsers).
  - `Cross-Origin-Opener-Policy: same-origin`; `Cross-Origin-Resource-Policy: same-origin`.
  - `Permissions-Policy`: camera, microphone, geolocation, payment, USB and topics disabled.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
  - `Cache-Control: no-store` on `/api/*`.

### 3b. Client-Side Output Safety (ASVS V5.3, V12)

- Links are built only through `src/lib/sanitize.ts` (`buildWhatsAppUrl`, `buildTelUrl`, `buildMailtoUrl`, `openExternal`): `encodeURIComponent`, digits-only phones, an `https:` host allow-list, and `noopener,noreferrer` on every `window.open`.
- Any CSV/spreadsheet export must use `csvSafeCell` to neutralise formula injection (cells beginning `= + - @`).
- Plans loaded from `localStorage` or share links are size-capped and re-validated with `PlanSchema` before use.

### 3c. Secrets & Supply Chain (ASVS V2.10, V14.2)

- `GEMINI_API_KEY` is server-side only with no hard-coded fallback. Never use a `VITE_` prefix for secrets (Vite inlines them into client JS). `.env*` is git-ignored; `.env.example` holds placeholders only.
- CI runs `npm audit --omit=dev` (fails on high+), scans `dist/` for secret-like strings, pins action SHAs, uses a read-only `GITHUB_TOKEN` and `npm ci --ignore-scripts`, and runs CodeQL.
- If a key is ever committed or shared in plaintext, rotate it immediately in Google AI Studio.

### 4. Privacy & Data Minimization

- **Client-Side First**: Guest lists, vendor notes, phone numbers, and family budget details are persisted in browser `localStorage`.
- **No Third-Party Tracking**: Zero telemetry, zero analytics scripts, and zero third-party cookie beacons are embedded.
- **API Key Security**: Backend proxies isolate the Google Gemini API credentials. The client never handles secret administrative tokens.

---

## Vulnerability Reporting

We welcome responsible vulnerability disclosures.

1. **How to report**: Open a confidential GitHub Security Advisory on `https://github.com/devbysatyam/prabandh/security/advisories` or contact the lead maintainer directly.
2. **Response time**: Acknowledgement within 24 hours; fix committed and deployed within 48 hours.
3. **Bounty & Attribution**: High-severity findings receive permanent credit in our release notes.
