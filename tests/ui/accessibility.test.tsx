// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { App } from '../../src/App';
import { WhatsAppModal } from '../../src/components/WhatsAppModal';
import { createSamplePlan } from '../../src/state/planStore';

const root = path.resolve(__dirname, '../../');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');

/** Compute an approximate accessible name for form controls / buttons. */
function accessibleName(el: Element): string {
  const aria = el.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
    if (text) return text;
  }
  const id = el.getAttribute('id');
  if (id) {
    const lab = document.querySelector(`label[for="${id}"]`);
    if (lab?.textContent?.trim()) return lab.textContent.trim();
  }
  const wrapping = el.closest('label');
  if (wrapping?.textContent?.trim()) return wrapping.textContent.trim();
  // Content (ignoring aria-hidden descendants)
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"], svg').forEach((n) => n.remove());
  const text = clone.textContent?.trim();
  if (text) return text;
  return el.getAttribute('title')?.trim() ?? '';
}

function auditDom(scope: HTMLElement = document.body) {
  const problems: string[] = [];

  scope.querySelectorAll('button, [role="button"]').forEach((el) => {
    if (!accessibleName(el)) {
      problems.push(`button without accessible name: ${el.outerHTML.slice(0, 120)}`);
    }
  });

  scope.querySelectorAll('input, select, textarea').forEach((el) => {
    if ((el as HTMLInputElement).type === 'hidden') return;
    if (!accessibleName(el)) {
      problems.push(`form control without label: ${el.outerHTML.slice(0, 120)}`);
    }
  });

  scope.querySelectorAll('a[href]').forEach((el) => {
    if (!accessibleName(el)) problems.push(`link without name: ${el.outerHTML.slice(0, 120)}`);
  });

  // Unique ids (required for label/for, aria-controls, aria-labelledby)
  const seen = new Set<string>();
  scope.querySelectorAll('[id]').forEach((el) => {
    if (seen.has(el.id)) problems.push(`duplicate id: ${el.id}`);
    seen.add(el.id);
  });

  // aria-labelledby / aria-describedby references resolve
  scope.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((el) => {
    ['aria-labelledby', 'aria-describedby'].forEach((attr) => {
      el.getAttribute(attr)
        ?.split(/\s+/)
        .forEach((id) => {
          if (id && !document.getElementById(id)) problems.push(`${attr} -> missing #${id}`);
        });
    });
  });

  scope.querySelectorAll('img').forEach((el) => {
    if (!el.hasAttribute('alt')) problems.push(`img without alt: ${el.outerHTML.slice(0, 100)}`);
  });

  // Tables need a caption and scoped header cells
  scope.querySelectorAll('table').forEach((table) => {
    if (!table.querySelector('caption')) problems.push('table without <caption>');
    table.querySelectorAll('th').forEach((th) => {
      if (!th.getAttribute('scope')) problems.push(`th without scope: ${th.textContent}`);
    });
  });

  // Heading order never skips a level going down
  let prev = 0;
  scope.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const level = Number(h.tagName[1]);
    if (prev && level > prev + 1) {
      problems.push(`heading skip h${prev} -> h${level}: ${h.textContent}`);
    }
    prev = level;
  });

  // Inline SVG icons must be hidden from AT unless they carry their own label
  scope.querySelectorAll('svg').forEach((svg) => {
    if (svg.getAttribute('aria-hidden') !== 'true' && !svg.getAttribute('aria-label')) {
      problems.push('svg icon not aria-hidden');
    }
  });

  return problems;
}

function openSampleApp() {
  window.localStorage.clear();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Explore Interactive Sample Celebration/i }));
}

describe('Accessibility: static document (index.html)', () => {
  it('declares language, title, viewport, description and does not block zoom', () => {
    expect(indexHtml).toMatch(/<html[^>]+lang="en-IN"/);
    expect(indexHtml).toMatch(/<title>[^<]{10,}<\/title>/);
    expect(indexHtml).toMatch(/name="viewport"[^>]*initial-scale=1/);
    expect(indexHtml).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
    expect(indexHtml).toMatch(/name="description"/);
    expect(indexHtml).toMatch(/<noscript>/);
  });

  it('marks Hindi text with lang="hi" via the LangText helper', () => {
    const helper = fs.readFileSync(path.join(root, 'src/components/LangText.tsx'), 'utf8');
    expect(helper).toContain('lang="hi"');
  });
});

describe('Accessibility: stylesheet', () => {
  it('provides focus-visible, reduced-motion, contrast, forced-colors, touch and print rules', () => {
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/prefers-contrast:\s*more/);
    expect(css).toMatch(/forced-colors:\s*active/);
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.skip-link/);
    expect(css).toMatch(/pointer:\s*coarse/);
  });
});

describe('Accessibility: rendered application', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => cleanup());

  it('welcome screen has skip link, landmarks, one h1 and labelled controls', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(document.getElementById('main-content')).not.toBeNull();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(document.querySelectorAll('h1').length).toBe(1);
    expect(auditDom()).toEqual([]);
  });

  it('every tab renders a clean, labelled, correctly ordered DOM', async () => {
    openSampleApp();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(10);
    for (const tab of tabs) {
      fireEvent.click(tab);
      // Tabs are code-split: wait for the lazy chunk so the real content (not the fallback) is audited.
      await waitFor(() => expect(screen.queryByText(/Loading section/)).toBeNull());
      expect(tab.getAttribute('aria-selected')).toBe('true');
      const panel = screen.getByRole('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);

      // Reveal inline forms so their controls are audited as well.
      screen
        .queryAllByRole('button')
        .filter((b) =>
          /^(\+|Add |Record |Log |Analy[sz]e|Parse|Compare)/i.test((b.textContent ?? '').trim()),
        )
        .forEach((b) => fireEvent.click(b));

      const problems = auditDom();
      expect(problems, `tab ${tab.id}: ${problems.join('\n')}`).toEqual([]);
      expect(document.querySelectorAll('h1').length).toBe(1);
    }
  });

  it('tabs follow the WAI-ARIA roving tabindex and arrow-key pattern', () => {
    openSampleApp();
    const tablist = screen.getByRole('tablist');
    expect(tablist.getAttribute('aria-label')).toBeTruthy();
    const tabs = within(tablist).getAllByRole('tab');
    const selected = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected.length).toBe(1);
    tabs.forEach((t) => {
      expect(t.getAttribute('tabindex')).toBe(t === selected[0] ? '0' : '-1');
    });

    const current = () =>
      screen.getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true');

    fireEvent.keyDown(selected[0] as HTMLElement, { key: 'ArrowRight' });
    expect(current()).toBe(tabs[(tabs.indexOf(selected[0] as HTMLElement) + 1) % tabs.length]);

    fireEvent.keyDown(current() as HTMLElement, { key: 'End' });
    expect(current()).toBe(tabs.at(-1));
    fireEvent.keyDown(current() as HTMLElement, { key: 'Home' });
    expect(current()).toBe(tabs[0]);
    fireEvent.keyDown(current() as HTMLElement, { key: 'ArrowLeft' });
    expect(current()).toBe(tabs.at(-1));
  });

  it('quick navigator is a disclosure that closes with Escape', () => {
    openSampleApp();
    const toggle = document.getElementById('quick-nav-toggle') as HTMLElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('quick-nav-menu')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a persistent polite live region for toasts', () => {
    openSampleApp();
    const live = document.querySelector('[role="status"][aria-live="polite"][aria-atomic="true"]');
    expect(live).not.toBeNull();
  });
});

describe('Accessibility: modal dialog (WhatsApp broadcast)', () => {
  afterEach(() => cleanup());

  it('exposes dialog semantics, traps focus, closes on Escape and restores focus', () => {
    const opener = document.createElement('button');
    opener.textContent = 'open';
    document.body.appendChild(opener);
    opener.focus();

    const onClose = vi.fn();
    const { unmount } = render(
      <WhatsAppModal plan={createSamplePlan()} today="2026-11-01" onClose={onClose} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const titleId = dialog.getAttribute('aria-labelledby') as string;
    expect(document.getElementById(titleId)?.textContent).toMatch(/WhatsApp/);
    // Focus moves into the dialog on open
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(auditDom(dialog)).toEqual([]);

    // Focus trap: Tab from last wraps to first, Shift+Tab from first wraps to last
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, [tabindex="0"]'));
    const first = focusables[0] as HTMLElement;
    const last = focusables.at(-1) as HTMLElement;
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
