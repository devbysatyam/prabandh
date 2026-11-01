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

### 3. Serverless API Defense & DoS Mitigation

- **Body Size Caps**: API endpoints enforce a strict `1 MB` (`MAX_BODY_BYTES = 1048576`) payload limit via Node.js stream byte counters. Excess payloads are terminated immediately with HTTP 413.
- **Method Enforcement**: All mutation and inference endpoints strictly require `POST` with `Content-Type: application/json`. Non-POST requests receive HTTP 405 Method Not Allowed.
- **Header Hardening**:
  - `Content-Security-Policy`: Restricts scripts, styles, fonts, and connects.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
  - `X-Frame-Options: DENY`: Complete clickjacking defense.
  - `Cross-Origin-Opener-Policy: same-origin`: Isolation from untrusted external contexts.
  - `Permissions-Policy`: Camera, microphone, and geolocation disabled.
  - `Strict-Transport-Security`: HSTS enforced with `max-age=63072000; includeSubDomains; preload`.

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
