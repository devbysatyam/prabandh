# Accessibility Guide — Prabandh · प्रबंध

Prabandh is designed to be accessible to all family members across generations, devices, and assistive technologies, adhering strictly to **WCAG 2.2 AA** guidelines.

---

## 1. Core Accessibility Standards

- **Keyboard Navigation**:
  - Full tab order across navigation tabs, budget sliders, guest inputs, and modals.
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-brand-500`) with high contrast.
  - Escape key support to dismiss all dialogs and modals.

- **Semantic HTML & ARIA**:
  - Native `<nav role="tablist">`, `<button role="tab">`, `<main>`, and `<article>` landmarks.
  - Interactive status badges use `role="status"` and `aria-live="polite"`.
  - Color is never used as the sole indicator of state; icons and text labels accompany every warning or critical badge.

- **Color Contrast & Dark Mode**:
  - Minimum 4.5:1 contrast ratio for all standard body copy.
  - Minimum 3:1 contrast ratio for large headings and input borders.
  - Seamless light and dark mode with semantic CSS design tokens.

- **Touch & Mobile Targets**:
  - All interactive buttons meet or exceed 44×44px hit targets on touch screens.
  - Responsive layout reflows from 320px mobile displays up to 4K desktop screens without text clipping.

---

## 2. WCAG 2.2 Conformance Details (AA, with many AAA items)

**Document & landmarks**

- `lang="en-IN"` on `<html>`; Hindi (Devanagari) runs are wrapped with `lang="hi"` (`LangText` helper) so screen readers switch voice (3.1.2).
- Unique descriptive `<title>` that updates with the active section (2.4.2); `noscript` fallback; `color-scheme` and `theme-color` metas; zooming is never disabled (1.4.4).
- Landmarks: `header` (banner), `nav` (Planning sections, Quick section jump), `main#main-content`, `footer`. One `h1` (brand); each tab panel starts with a visually hidden `h2`, so headings never skip levels. The print-only summary uses `h2`.
- Skip link ("Skip to main content") is the first focusable element and targets `main` (2.4.1).

**Keyboard & focus**

- Tabs follow the WAI-ARIA APG pattern: `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabindex`, Arrow/Home/End navigation. The `nav` landmark wraps the `tablist` rather than being overridden by it.
- Global `:focus-visible` indicator: 3px solid outline plus a contrasting 5px halo, light and dark variants, Windows forced-colors variant (2.4.7, 2.4.11, 2.4.13). Sticky bars are cleared with `scroll-padding-top`.
- Modal dialog (`WhatsAppModal`): `role=dialog`, `aria-modal`, `aria-labelledby`, `aria-describedby`, initial focus on Close, Tab/Shift+Tab trap, Escape and backdrop click close, focus restored to the opener.
- Quick-jump menu is a disclosure (`aria-expanded`, `aria-controls`) and closes with Escape, returning focus to its toggle.

**Forms**

- Every `input`, `select` and `textarea` has a programmatic name (`label[for]` and/or `aria-label`); radio-like button groups use `role=group` + `aria-labelledby` and toggles expose `aria-pressed`.
- Errors/validation: `role=alert` for parse errors, `role=status` for success, `aria-invalid` + `aria-describedby` on the budget field. `autocomplete` is set where meaningful (`address-level2` for city) and disabled for free-form numeric fields.
- Native `required` attributes; submit buttons expose `aria-busy` while work is in flight.

**Live regions / status**

- Toast container is a persistent `role=status aria-live=polite aria-atomic` region; dismiss button is labelled. Copy confirmations (share, WhatsApp text) announce through visually hidden status regions. The copilot transcript is a `role=log` region.

**Tables, images, icons**

- All data tables have a (visually hidden) `<caption>`, `th scope="col"`, and row headers (`th scope="row"`) where applicable.
- All inline SVG icons and decorative emoji are `aria-hidden`; icon-only buttons carry `aria-label`; star ratings expose "Rated N out of 5" to assistive tech; badges always include text (never colour only).

**Colour, motion, preferences**

- Light-theme text uses stone-600/700 or darker and brand/emerald/amber-700 (>= 4.5:1; most body text >= 7:1). White-on-colour fills use the 700 shade (brand-700 `#c2410c` = 5.2:1). Dark theme uses 300/400 text on stone-900/950.
- `prefers-reduced-motion` disables animations/transitions; `prefers-contrast: more` strengthens borders and muted text; `forced-colors` keeps borders, selection and focus visible; decorative pulses use `motion-safe:`.
- Print stylesheet hides interactive chrome, prints link URLs, avoids splitting cards/rows and repeats table headers.

**Targets (2.5.8)**

- Buttons/inputs have a minimum height of 32-40px, tabs and the quick navigator 44px, and every control is at least 24x24 CSS px; coarse pointers get 44px minimums.

## 3. Automated Checks

`tests/ui/accessibility.test.tsx` (jsdom) renders the whole app, visits every tab (opening inline forms) and asserts: every button/link has an accessible name, every form control is labelled, ids are unique, ARIA references resolve, tables have captions and scoped headers, heading levels never skip, icons are hidden from AT, there is exactly one `h1`, the skip link and landmarks exist, the tabs keyboard model works, the quick menu closes on Escape, the toast live region exists, and the dialog traps/restores focus. It also checks `index.html` (lang, title, viewport, noscript) and the stylesheet (focus-visible, reduced-motion, contrast, forced-colors, print, coarse pointer).

Manual checks still recommended before release: NVDA/VoiceOver walkthrough, 200%/400% zoom reflow, and Windows High Contrast.
