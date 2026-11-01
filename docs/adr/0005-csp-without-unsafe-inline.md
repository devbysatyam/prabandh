# ADR 0005: Content Security Policy without unsafe-inline for scripts and styles

- Status: Accepted
- Date: 2026-11-02

## Context

Inline scripts and style elements are the main route for XSS payloads to execute. The app is a static SPA, so it does not need them.

## Decision

`vercel.json` sets `script-src 'self'` and `style-src 'self'` (plus the Google Fonts stylesheet host), with no `unsafe-inline` and no `unsafe-eval`. Styles are built to external CSS by Tailwind; there are no inline `<script>` or `<style>` blocks. Only `style-src-attr 'unsafe-inline'` is allowed, because React `style={{...}}` props (progress bar widths) compile to style attributes, which cannot run script. Other headers: `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

## Consequences

- Injected inline script is blocked by the browser even if sanitisation fails.
- Do not add inline scripts, `eval`, or third-party script hosts; use bundled modules.
- New external origins (fonts, images) need an explicit CSP change and review.
