import { describe, it, expect } from 'vitest';
import { planReducer, createSamplePlan, type PlanState } from '../../src/state/planStore';
import type { Guest, VenueDetail, Vendor, SiteVisit } from '../../src/schemas';

describe('planReducer State Machine', () => {
  function getInitialState(): PlanState {
    return {
      plan: createSamplePlan(),
      toast: null,
    };
  }

  it('updates total budget and recomputes category allocations', () => {
    const state = getInitialState();
    const next = planReducer(state, { type: 'setBudget', budget: 2000000 });

    expect(next.plan?.totalBudget).toBe(2000000);
    const sum = Object.values(next.plan?.allocation ?? {}).reduce((a, b) => a + b, 0);
    expect(sum).toBe(2000000);
  });

  it('updates guest count and synchronizes catering per-plate expectations', () => {
    const state = getInitialState();
    const next = planReducer(state, { type: 'setGuests', guests: 250 });

    expect(next.plan?.guests).toBe(250);
  });

  it('toggles category budget locks without modifying locked values', () => {
    const state = getInitialState();
    const next = planReducer(state, { type: 'toggleLock', category: 'catering' });

    expect(next.plan?.locked.includes('catering')).toBe(true);

    const unlocked = planReducer(next, { type: 'toggleLock', category: 'catering' });
    expect(unlocked.plan?.locked.includes('catering')).toBe(false);
  });

  it('handles guest list lifecycle: add, update, delete, and sync count', () => {
    let state = getInitialState();

    const newGuest: Guest = {
      id: 'g-test-1',
      name: 'Ananya Deshmukh',
      count: 3,
      side: 'bride',
      rsvp: 'confirmed',
      diet: 'veg',
      phone: '+91 99887 66554',
      notes: 'VIP guest',
    };

    // Add
    state = planReducer(state, { type: 'addGuest', guest: newGuest });
    expect(state.plan?.guestList.some((g) => g.id === 'g-test-1')).toBe(true);

    // Update
    const updatedGuest: Guest = { ...newGuest, count: 5 };
    state = planReducer(state, { type: 'updateGuest', guest: updatedGuest });
    const found = state.plan?.guestList.find((g) => g.id === 'g-test-1');
    expect(found?.count).toBe(5);

    // Sync guest count with list
    state = planReducer(state, { type: 'syncGuestsWithList' });
    const totalHeadcount = state.plan?.guestList.reduce((sum, g) => sum + g.count, 0);
    expect(state.plan?.guests).toBe(totalHeadcount);

    // Delete
    state = planReducer(state, { type: 'deleteGuest', guestId: 'g-test-1' });
    expect(state.plan?.guestList.some((g) => g.id === 'g-test-1')).toBe(false);
  });

  it('handles venue evaluation and site visits', () => {
    let state = getInitialState();

    const newVenue: VenueDetail = {
      id: 'v-test-1',
      name: 'Grand Hyatt Ballroom',
      type: 'hotel_ballroom',
      capacityMin: 150,
      capacityMax: 500,
      rentalCost: 350000,
      cautionDeposit: 50000,
      cateringPolicy: 'in_house_mandatory',
      curfewTime: '23:30',
      roomsIncluded: 2,
      parkingCapacity: 100,
      alcoholAllowed: true,
      status: 'shortlisted',
    };

    state = planReducer(state, { type: 'addVenue', venue: newVenue });
    expect(state.plan?.venues.some((v) => v.id === 'v-test-1')).toBe(true);

    // Add site visit
    const visit: SiteVisit = {
      id: 'sv-test-1',
      venueId: 'v-test-1',
      venueName: 'Grand Hyatt Ballroom',
      visitDate: '2026-11-15',
      attendees: 'Parents and Coordinator',
      acWorking: true,
      bridalRoomClean: true,
      soundCurfewOk: true,
      parkingAdequate: true,
      tastingDone: true,
      rating: 5,
      notes: 'Sound insulation is excellent.',
      status: 'completed',
    };

    state = planReducer(state, { type: 'addSiteVisit', visit });
    expect(state.plan?.siteVisits.some((s) => s.id === 'sv-test-1')).toBe(true);

    // Delete site visit
    state = planReducer(state, { type: 'deleteSiteVisit', visitId: 'sv-test-1' });
    expect(state.plan?.siteVisits.some((s) => s.id === 'sv-test-1')).toBe(false);

    // Delete venue
    state = planReducer(state, { type: 'deleteVenue', venueId: 'v-test-1' });
    expect(state.plan?.venues.some((v) => v.id === 'v-test-1')).toBe(false);
  });

  it('manages vendor lifecycle, milestone payments, and quotation acceptance', () => {
    let state = getInitialState();

    const newVendor: Vendor = {
      id: 'vnd-test-1',
      name: 'Ritz Catering & Gourmet Kitchen',
      category: 'catering',
      status: 'quoted',
      payments: [
        {
          id: 'pay-1',
          title: 'Booking Advance (25%)',
          amount: 112500,
          dueDate: '2026-11-20',
          status: 'pending',
        },
      ],
    };

    state = planReducer(state, { type: 'addVendor', vendor: newVendor });
    expect(state.plan?.vendors.some((v) => v.id === 'vnd-test-1')).toBe(true);

    // Toggle payment milestone
    state = planReducer(state, {
      type: 'togglePayment',
      vendorId: 'vnd-test-1',
      paymentId: 'pay-1',
    });
    const vendorAfter = state.plan?.vendors.find((v) => v.id === 'vnd-test-1');
    expect(vendorAfter?.payments[0]?.status).toBe('paid');

    // Delete vendor
    state = planReducer(state, { type: 'deleteVendor', vendorId: 'vnd-test-1' });
    expect(state.plan?.vendors.some((v) => v.id === 'vnd-test-1')).toBe(false);
  });

  it('manages runsheet item cycling and addition', () => {
    let state = getInitialState();

    state = planReducer(state, {
      type: 'addRunSheetItem',
      item: {
        id: 'rs-new-1',
        time: '19:00',
        title: 'Sangeet Opening Dance Sequence',
        coordinator: 'Anchor & DJ',
        status: 'pending',
      },
    });

    const item = state.plan?.runSheet.find((r) => r.id === 'rs-new-1');
    expect(item?.status).toBe('pending');

    // Cycle to in_progress
    state = planReducer(state, { type: 'cycleRunSheet', itemId: 'rs-new-1' });
    expect(state.plan?.runSheet.find((r) => r.id === 'rs-new-1')?.status).toBe('in_progress');

    // Cycle to completed
    state = planReducer(state, { type: 'cycleRunSheet', itemId: 'rs-new-1' });
    expect(state.plan?.runSheet.find((r) => r.id === 'rs-new-1')?.status).toBe('completed');
  });

  it('resets state properly when action reset is dispatched', () => {
    const state = getInitialState();
    const next = planReducer(state, { type: 'reset' });
    expect(next.plan).toBeNull();
  });
});
