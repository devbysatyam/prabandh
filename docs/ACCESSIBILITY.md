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
