// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWithBoundary from '../../src/App';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { requireDefined } from '../helpers';

async function openSample(user: ReturnType<typeof userEvent.setup>) {
  render(<AppWithBoundary />);
  await user.click(screen.getByRole('button', { name: /Explore Interactive Sample Celebration/i }));
  await screen.findByRole('tab', { name: /Overview/i });
}

async function gotoTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('tab', { name }));
  // Tabs are React.lazy: wait for the chunk to replace the Suspense fallback.
  await waitFor(() => expect(screen.queryByText(/Loading section/)).toBeNull());
}

describe('application flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the plan setup on first load and creates a plan from the form', async () => {
    const user = userEvent.setup();
    render(<AppWithBoundary />);
    expect(screen.queryByRole('tablist')).toBeNull();

    const budget = screen.getByLabelText(/Total Budget/i);
    await user.clear(budget);
    await user.type(budget, '12 lakh');
    expect(budget.getAttribute('aria-invalid')).toBe('false');

    await user.click(screen.getByRole('button', { name: /Build Connected Plan/i }));
    expect(await screen.findByRole('tablist')).toBeTruthy();
    expect(screen.getByText(/New plan created/i)).toBeTruthy();
    expect(window.localStorage.getItem('prabandh_plan_v1')).toContain('1200000');
  });

  it('plan setup flags an unparseable budget and clamps tiny budgets on submit', async () => {
    const user = userEvent.setup();
    render(<AppWithBoundary />);
    const budget = screen.getByLabelText(/Total Budget/i);
    await user.clear(budget);
    await user.type(budget, 'lots of money');
    expect(budget.getAttribute('aria-invalid')).toBe('true');

    await user.clear(budget);
    await user.type(budget, '500');
    await user.click(screen.getByRole('button', { name: /Build Connected Plan/i }));
    await screen.findByRole('tablist');
    const saved = JSON.parse(requireDefined(window.localStorage.getItem('prabandh_plan_v1'))) as {
      totalBudget: number;
    };
    expect(saved.totalBudget).toBeGreaterThanOrEqual(500);
    expect(Number.isInteger(saved.totalBudget)).toBe(true);
  });

  it('shows a recoverable error when AI intake parsing fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<AppWithBoundary />);
    const box = screen.getByRole('textbox', { name: /Natural Language Event Description/i });
    await user.type(box, 'Shaadi in Pune with 200 guests');
    await user.click(screen.getByRole('button', { name: /Fill Form From Description/i }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Could not parse/i);
    vi.unstubAllGlobals();
  });

  it('switches between tabs and keeps the document title and panel in sync', async () => {
    const user = userEvent.setup();
    await openSample(user);
    expect(document.title).toMatch(/^Overview/);

    await gotoTab(user, /Budget/i);
    expect(screen.getByRole('tab', { name: /Budget/i }).getAttribute('aria-selected')).toBe('true');
    expect(document.title).toMatch(/^Budget/);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('tab-budget');

    await gotoTab(user, /Guest List/i);
    expect(document.title).toMatch(/^Guest List/);
    await gotoTab(user, /Vision/i);
    expect(screen.getByRole('button', { name: /Update Connected Celebration/i })).toBeTruthy();
  });

  it('editing the plan from Vision & Setup updates the plan and returns to Overview', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Vision/i);
    const guests = screen.getByLabelText(/Target Guest Headcount/i);
    await user.clear(guests);
    await user.type(guests, '150');
    await user.click(screen.getByRole('button', { name: /Update Connected Celebration/i }));
    expect(await screen.findByText(/Celebration vision updated/i)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Overview/i }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('adds a guest from the Guests tab and shows a dismissible toast', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Guest List/i);

    await user.click(screen.getByRole('button', { name: /Add Guest \/ Family/i }));
    const form = screen.getByRole('textbox', { name: /Family or guest name/i }).closest('form');
    expect(form).not.toBeNull();
    const scoped = within(requireDefined(form));

    // Blank names are rejected by the form.
    await user.click(scoped.getByRole('button', { name: /Save Guest/i }));
    expect(screen.queryByText(/Added Test Kapoor/i)).toBeNull();

    await user.type(scoped.getByRole('textbox', { name: /Family or guest name/i }), 'Test Kapoor');
    await user.selectOptions(scoped.getByRole('combobox', { name: /Family side/i }), 'bride');
    await user.click(scoped.getByRole('button', { name: /Save Guest/i }));

    expect(await screen.findByText(/Added Test Kapoor to guest list/i)).toBeTruthy();
    expect(screen.getAllByText(/Test Kapoor/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Dismiss notification/i }));
    expect(screen.queryByText(/Added Test Kapoor to guest list/i)).toBeNull();
  });

  it('cancels the add-guest form without adding anything', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Guest List/i);
    await user.click(screen.getByRole('button', { name: /Add Guest \/ Family/i }));
    const form = requireDefined(
      screen.getByRole('textbox', { name: /Family or guest name/i }).closest('form'),
    );
    await user.click(within(form).getAllByRole('button', { name: /Cancel/i })[0] as HTMLElement);
    expect(screen.queryByRole('textbox', { name: /Family or guest name/i })).toBeNull();
  });

  it('changes an RSVP and deletes a guest', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Guest List/i);
    const deletes = screen.getAllByRole('button', { name: 'Delete Guest' });
    const before = deletes.length;
    await user.click(requireDefined(deletes[0]));
    expect(screen.getAllByRole('button', { name: 'Delete Guest' }).length).toBe(before - 1);

    const select = requireDefined(screen.getAllByRole('combobox', { name: /RSVP status for/i })[0]);
    await user.selectOptions(select, 'declined');
    expect((select as HTMLSelectElement).value).toBe('declined');
  });

  it('adds a vendor manually from the Vendors tab', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Vendors/i);

    await user.click(await screen.findByRole('button', { name: /^Add Vendor$/i }));
    const name = screen.getByRole('textbox', { name: /Vendor or business name/i });
    await user.type(name, 'Test Sound Co');
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Vendor category/i }),
      'entertainment',
    );
    await user.type(
      screen.getByRole('textbox', { name: /Vendor WhatsApp contact phone/i }),
      '9876543210',
    );
    await user.click(screen.getByRole('button', { name: /Save Vendor/i }));

    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: /Vendor or business name/i })).toBeNull(),
    );
    const stored = JSON.parse(requireDefined(window.localStorage.getItem('prabandh_plan_v1'))) as {
      vendors: { name: string; category: string }[];
    };
    expect(stored.vendors.some((v) => v.name === 'Test Sound Co')).toBe(true);
  });

  it('changes the total budget on the Budget tab and rebalances allocations', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Budget/i);

    const total = screen.getByRole('spinbutton', { name: /Total celebration budget/i });
    fireEvent.change(total, { target: { value: '2000000' } });
    expect(await screen.findByText(/Total budget updated/i)).toBeTruthy();

    const saved = JSON.parse(requireDefined(window.localStorage.getItem('prabandh_plan_v1'))) as {
      totalBudget: number;
      allocation: Record<string, number>;
    };
    expect(saved.totalBudget).toBe(2000000);
    expect(Object.values(saved.allocation).reduce((s, n) => s + n, 0)).toBe(2000000);
  });

  it('changes a category allocation amount and keeps the sum intact', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Budget/i);
    const decor = screen.getByRole('spinbutton', { name: /decor allocation amount in rupees/i });
    await user.clear(decor);
    await user.type(decor, '100000');
    const saved = JSON.parse(requireDefined(window.localStorage.getItem('prabandh_plan_v1'))) as {
      totalBudget: number;
      allocation: Record<string, number>;
    };
    expect(Object.values(saved.allocation).reduce((s, n) => s + n, 0)).toBe(saved.totalBudget);
  });

  it('shows venues and analytics content and resets the plan after confirmation', async () => {
    const user = userEvent.setup();
    await openSample(user);
    await gotoTab(user, /Venues/i);
    expect(screen.getByRole('tabpanel')).toBeTruthy();
    await gotoTab(user, /Analytics/i);
    expect(screen.getByRole('tabpanel')).toBeTruthy();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Reset Plan' }));
    expect(screen.getByRole('tablist')).toBeTruthy();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: 'Reset Plan' }));
    expect(await screen.findByText(/Plan has been reset/i)).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});

describe('ErrorBoundary', () => {
  afterEach(() => cleanup());

  function Bomb({ explode }: { explode: boolean }) {
    if (explode) throw new Error('secret plan data');
    return <p>All good</p>;
  }

  it('renders an alert fallback without leaking the error message, and can retry', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let explode = true;
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb explode={explode} />
      </ErrorBoundary>,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/Something went wrong/);
    expect(alert.textContent).not.toMatch(/secret plan data/);
    expect(spy.mock.calls.some((c) => c.join(' ').includes('[ErrorBoundary] Error'))).toBe(true);
    const own = spy.mock.calls.filter((c) => String(c[0]).startsWith('[ErrorBoundary]'));
    expect(own.flat().join(' ')).not.toContain('secret plan data');

    explode = false;
    rerender(
      <ErrorBoundary>
        <Bomb explode={explode} />
      </ErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(screen.getByText('All good')).toBeTruthy();
    spy.mockRestore();
  });

  it('uses a custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={(reset) => <button onClick={reset}>custom fallback</button>}>
        <Bomb explode />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: 'custom fallback' })).toBeTruthy();
    spy.mockRestore();
  });
});
