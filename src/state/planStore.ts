import { useReducer, useEffect, useCallback } from 'react';
import {
  type Category,
  type Guest,
  type Intake,
  type PaymentMilestone,
  type Plan,
  type RunSheetItem,
  type SiteVisit,
  type StoredQuote,
  type TaskStatus,
  type Vendor,
  type VendorMeeting,
  type VenueDetail,
  PlanSchema,
} from '../schemas';
import {
  allocate,
  applyOption,
  compressTasks,
  diffDays,
  redistribute,
  syncGuestCountWithList,
} from '../engine';
import { OCCASION_TASKS, OCCASION_RUNSHEET } from '../engine/presets';

const STORAGE_KEY = 'prabandh_plan_v1';

export type Action =
  | { type: 'create'; intake: Intake }
  | { type: 'updateIntake'; intake: Intake }
  | { type: 'setBudget'; budget: number }
  | { type: 'setGuests'; guests: number }
  | { type: 'setAmount'; category: Category; amount: number }
  | { type: 'toggleLock'; category: Category }
  | { type: 'toggleContacted'; category: Category }
  | { type: 'setTaskStatus'; taskId: string; status: TaskStatus }
  | { type: 'setTaskDelay'; taskId: string; delayDays: number }
  | { type: 'addGuest'; guest: Guest }
  | { type: 'updateGuest'; guest: Guest }
  | { type: 'deleteGuest'; guestId: string }
  | { type: 'syncGuestsWithList'; useConfirmedOnly?: boolean }
  | { type: 'addVenue'; venue: VenueDetail }
  | { type: 'updateVenue'; venue: VenueDetail }
  | { type: 'deleteVenue'; venueId: string }
  | { type: 'addSiteVisit'; visit: SiteVisit }
  | { type: 'updateSiteVisit'; visit: SiteVisit }
  | { type: 'deleteSiteVisit'; visitId: string }
  | { type: 'addVendor'; vendor: Vendor }
  | { type: 'updateVendor'; vendor: Vendor }
  | { type: 'deleteVendor'; vendorId: string }
  | { type: 'addPayment'; vendorId: string; payment: PaymentMilestone }
  | { type: 'togglePayment'; vendorId: string; paymentId: string }
  | { type: 'addStoredQuote'; stored: StoredQuote }
  | { type: 'acceptStoredQuote'; quoteId: string }
  | { type: 'deleteStoredQuote'; quoteId: string }
  | { type: 'addVendorMeeting'; meeting: VendorMeeting }
  | { type: 'updateVendorMeeting'; meeting: VendorMeeting }
  | { type: 'deleteVendorMeeting'; meetingId: string }
  | { type: 'cycleRunSheet'; itemId: string }
  | { type: 'addRunSheetItem'; item: RunSheetItem }
  | { type: 'applyTradeoff'; optionId: 'reduce_guests' | 'trim_categories' | 'use_contingency' }
  | { type: 'loadPlan'; plan: Plan }
  | { type: 'loadSamplePlan' }
  | { type: 'reset' };

export interface PlanState {
  plan: Plan | null;
  toast: { message: string; type: 'info' | 'success' | 'warn' } | null;
}

export function createDefaultPlan(intake: Intake, today: string = new Date().toISOString().slice(0, 10)): Plan {
  const allocation = allocate(intake.totalBudget, intake.occasion, intake.priorities);
  const perPlate = intake.guests > 0 ? Math.round(allocation.catering / intake.guests) : 1000;

  // Generate initial tasks
  const rawTasks = OCCASION_TASKS[intake.occasion] ?? [];
  const daysToEvent = Math.max(1, diffDays(today, intake.eventDate));
  const tasksWithIds = rawTasks.map((t, index) => ({
    ...t,
    id: `task-${index + 1}`,
  }));
  const tasks = compressTasks(tasksWithIds, daysToEvent);

  // Generate initial day-of runsheet
  const rawRunsheet = OCCASION_RUNSHEET[intake.occasion] ?? [];
  const runSheet: RunSheetItem[] = rawRunsheet.map((r, index) => ({
    ...r,
    id: `rs-${index + 1}`,
    status: 'pending',
  }));

  // Initial vendor checklist
  const categoriesToBook: Category[] = [
    'venue',
    'catering',
    'decor',
    'photography',
    'entertainment',
    'misc',
  ];
  const vendors: Vendor[] = categoriesToBook.map((cat, i) => ({
    id: `v-${i + 1}`,
    name: `Preferred ${cat.toUpperCase()} Vendor`,
    category: cat,
    status: 'shortlisted',
    payments: [],
  }));

  // Initial starter venue option
  const initialVenues: VenueDetail[] = [
    {
      id: `venue-1`,
      name: `${intake.city ?? 'City'} Royal Heritage Lawn & Ballroom`,
      type: 'outdoor_lawn',
      capacityMin: 100,
      capacityMax: Math.max(300, intake.guests + 100),
      rentalCost: Math.round(allocation.venue * 0.85),
      cateringPolicy: 'external_allowed',
      alcoholAllowed: true,
      parkingCapacity: 150,
      roomsIncluded: 3,
      curfewTime: '23:00',
      cautionDeposit: 30000,
      address: intake.city ? `${intake.city} Bypass Road` : 'Central Celebration Avenue',
      status: 'shortlisted',
      notes: 'Lush green lawn with attached air-conditioned dining banquet hall.',
    },
  ];

  const title = `${intake.occasion === 'wedding' ? 'Grand Wedding' : intake.occasion === 'kids_birthday' ? "Kid's Birthday Celebration" : intake.occasion === 'milestone' ? 'Milestone Celebration' : 'Community Festival'} Plan`;

  return {
    id: `plan-${Date.now()}`,
    version: 1,
    title,
    occasion: intake.occasion,
    eventDate: intake.eventDate,
    totalBudget: intake.totalBudget,
    guests: intake.guests,
    vibe: intake.vibe ?? 'Elegant, joyful celebration with close friends and family',
    city: intake.city,
    priorities: intake.priorities,
    priorityKeys: intake.priorityKeys ?? [],
    allocation,
    locked: [],
    contacted: [],
    perPlate,
    tasks,
    guestList: [],
    vendors,
    venues: initialVenues,
    siteVisits: [],
    quotes: [],
    vendorMeetings: [],
    runSheet,
  };
}

export function createSamplePlan(today: string = new Date().toISOString().slice(0, 10)): Plan {
  const d = new Date(today);
  d.setMonth(d.getMonth() + 4);
  const eventDate = d.toISOString().slice(0, 10);

  const sampleIntake: Intake = {
    occasion: 'wedding',
    totalBudget: 1500000,
    guests: 200,
    eventDate,
    city: 'Pune',
    vibe: 'Royal heritage celebration with authentic Awadhi feast and soulful acoustic music',
    priorities: ['catering', 'venue', 'photography'],
    priorityKeys: ['catering', 'venue', 'photography'],
  };

  const plan = createDefaultPlan(sampleIntake, today);

  const venue1: VenueDetail = {
    id: 'venue-sample-1',
    name: 'Amaltas Heritage Palace & Grand Lawn',
    type: 'heritage_resort',
    capacityMin: 150,
    capacityMax: 450,
    rentalCost: 320000,
    cateringPolicy: 'royalty_fee',
    alcoholAllowed: true,
    parkingCapacity: 150,
    roomsIncluded: 4,
    curfewTime: '23:00',
    cautionDeposit: 35000,
    address: 'NH-48 Pune Bypass, Bavdhan, Pune',
    status: 'booked',
    notes: 'Breathtaking 100-year-old banyan tree mandap area with attached air-conditioned banquet hall.',
  };

  const venue2: VenueDetail = {
    id: 'venue-sample-2',
    name: 'The Orchid Grand Ballroom & Terrace',
    type: 'hotel_ballroom',
    capacityMin: 100,
    capacityMax: 350,
    rentalCost: 280000,
    cateringPolicy: 'in_house_mandatory',
    alcoholAllowed: true,
    parkingCapacity: 200,
    roomsIncluded: 3,
    curfewTime: '00:00',
    cautionDeposit: 25000,
    address: 'Senapati Bapat Road, Shivajinagar, Pune',
    status: 'visited',
    notes: 'Premium 5-star hospitality, carpeted luxury banquet, central city location.',
  };

  const visit1: SiteVisit = {
    id: 'visit-sample-1',
    venueId: 'venue-sample-1',
    venueName: 'Amaltas Heritage Palace & Grand Lawn',
    visitDate: today,
    attendees: "Groom's Parents, Bride's Brother & Chacha ji",
    rating: 5,
    acWorking: true,
    bridalRoomClean: true,
    soundCurfewOk: true,
    parkingAdequate: true,
    tastingDone: true,
    tastingNotes: 'Tasted Gulab Jamun, live chaat, and Paneer Tikka. Exceptional quality and prompt service.',
    notes: 'Checked power backup generator. Verified 4 bridal rooms with attached restrooms. Manager agreed to 25% token advance.',
    status: 'completed',
  };

  const sampleGuests: Guest[] = [
    { id: 'g-1', name: 'Sharma Family (Groom Parents & Sister)', count: 4, side: 'groom', rsvp: 'confirmed', diet: 'veg', phone: '+91 98230 11223' },
    { id: 'g-2', name: 'Verma Family (Bride Parents & Didi)', count: 5, side: 'bride', rsvp: 'confirmed', diet: 'veg', phone: '+91 98901 44556' },
    { id: 'g-3', name: 'Rajesh & Sunita Kulkarni (Maternal Uncle)', count: 3, side: 'groom', rsvp: 'confirmed', diet: 'jain', phone: '+91 94220 77889' },
    { id: 'g-4', name: 'Dr. Anand Joshi & Family', count: 4, side: 'mutual', rsvp: 'pending', diet: 'veg', phone: '+91 98225 33445' },
    { id: 'g-5', name: 'College Friends Group (Dev, Rohan, Priya)', count: 6, side: 'groom', rsvp: 'confirmed', diet: 'any', phone: '+91 97654 11220' },
    { id: 'g-6', name: 'Office Team (Satyam, Anjali, Vicky)', count: 5, side: 'bride', rsvp: 'pending', diet: 'veg', phone: '+91 99221 88990' },
  ];

  const meeting1: VendorMeeting = {
    id: 'vm-sample-1',
    vendorId: 'v-2',
    vendorName: 'Royal Awadhi Master Caterers',
    category: 'catering',
    meetingDate: today,
    meetingType: 'food_tasting',
    attendees: 'Both Families (6 members)',
    rating: 5,
    dishesOrItemsTested: 'Dal Bukhara, Paneer Lababdar, Live Jalebi & Rabdi, Dahi Bhalla',
    feedback: 'Food was delicious. Requested slightly less spice in Dal Makhani for elderly guests. Head chef Ramesh agreed.',
    status: 'completed',
  };

  return {
    ...plan,
    title: 'Sharma & Verma Grand Royal Wedding',
    venues: [venue1, venue2],
    siteVisits: [visit1],
    guestList: sampleGuests,
    vendorMeetings: [meeting1],
  };
}

export function planReducer(state: PlanState, action: Action): PlanState {
  if (action.type === 'reset') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    return { plan: null, toast: { message: 'Plan has been reset.', type: 'info' } };
  }

  if (action.type === 'loadSamplePlan') {
    const sample = createSamplePlan();
    return { plan: sample, toast: { message: 'Loaded curated celebration demo plan!', type: 'success' } };
  }

  if (action.type === 'loadPlan') {
    return { plan: action.plan, toast: { message: 'Plan loaded successfully.', type: 'success' } };
  }

  if (action.type === 'create') {
    const newPlan = createDefaultPlan(action.intake);
    return {
      plan: newPlan,
      toast: { message: `New plan created in प्रबंध (Prabandh)!`, type: 'success' },
    };
  }

  if (!state.plan) return state;
  const p = state.plan;

  switch (action.type) {
    case 'setBudget': {
      const newAlloc = allocate(action.budget, p.occasion, p.priorities);
      return {
        ...state,
        plan: {
          ...p,
          totalBudget: action.budget,
          allocation: newAlloc,
        },
        toast: { message: 'Total budget updated and re-allocated.', type: 'info' },
      };
    }

    case 'setGuests': {
      const newGuests = Math.max(1, action.guests);
      return {
        ...state,
        plan: {
          ...p,
          guests: newGuests,
        },
        toast: { message: `Guest count updated to ${newGuests}.`, type: 'info' },
      };
    }

    case 'setAmount': {
      const res = redistribute(p.allocation, action.category, action.amount, p.locked);
      return {
        ...state,
        plan: {
          ...p,
          allocation: res.allocation,
        },
        toast: res.capped
          ? { message: 'Reached maximum feasible limit for category.', type: 'warn' }
          : null,
      };
    }

    case 'toggleLock': {
      const isLocked = p.locked.includes(action.category);
      const locked = isLocked
        ? p.locked.filter((c) => c !== action.category)
        : [...p.locked, action.category];
      return {
        ...state,
        plan: { ...p, locked },
        toast: {
          message: `${action.category} category is now ${isLocked ? 'unlocked' : 'locked'}.`,
          type: 'info',
        },
      };
    }

    case 'toggleContacted': {
      const contacted = p.contacted.includes(action.category)
        ? p.contacted.filter((c) => c !== action.category)
        : [...p.contacted, action.category];
      return {
        ...state,
        plan: { ...p, contacted },
      };
    }

    case 'setTaskStatus': {
      const tasks = p.tasks.map((t) =>
        t.id === action.taskId ? { ...t, status: action.status } : t,
      );
      return { ...state, plan: { ...p, tasks } };
    }

    case 'setTaskDelay': {
      const tasks = p.tasks.map((t) =>
        t.id === action.taskId ? { ...t, delayDays: action.delayDays, status: (action.delayDays > 0 ? 'delayed' : 'todo') as TaskStatus } : t,
      );
      return {
        ...state,
        plan: { ...p, tasks },
        toast: { message: `Applied ${action.delayDays} day delay. Downstream dates updated.`, type: 'warn' },
      };
    }

    case 'addGuest': {
      const guestList = [action.guest, ...p.guestList];
      return {
        ...state,
        plan: { ...p, guestList },
        toast: { message: `Added ${action.guest.name} to guest list.`, type: 'success' },
      };
    }

    case 'updateGuest': {
      const guestList = p.guestList.map((g) => (g.id === action.guest.id ? action.guest : g));
      return { ...state, plan: { ...p, guestList } };
    }

    case 'deleteGuest': {
      const guestList = p.guestList.filter((g) => g.id !== action.guestId);
      return { ...state, plan: { ...p, guestList } };
    }

    case 'syncGuestsWithList': {
      const updated = syncGuestCountWithList(p, action.useConfirmedOnly);
      return {
        ...state,
        plan: updated,
        toast: { message: `Target guest count synced to ${updated.guests}.`, type: 'success' },
      };
    }

    case 'addVenue': {
      const venues = [...(p.venues ?? []), action.venue];
      return {
        ...state,
        plan: { ...p, venues },
        toast: { message: `Added venue "${action.venue.name}".`, type: 'success' },
      };
    }

    case 'updateVenue': {
      const venues = (p.venues ?? []).map((v) => (v.id === action.venue.id ? action.venue : v));
      return { ...state, plan: { ...p, venues } };
    }

    case 'deleteVenue': {
      const venues = (p.venues ?? []).filter((v) => v.id !== action.venueId);
      return { ...state, plan: { ...p, venues } };
    }

    case 'addVendor': {
      const vendors = [...p.vendors, action.vendor];
      return { ...state, plan: { ...p, vendors } };
    }

    case 'updateVendor': {
      const vendors = p.vendors.map((v) => (v.id === action.vendor.id ? action.vendor : v));
      return { ...state, plan: { ...p, vendors } };
    }

    case 'deleteVendor': {
      const vendors = p.vendors.filter((v) => v.id !== action.vendorId);
      return { ...state, plan: { ...p, vendors } };
    }

    case 'addPayment': {
      const vendors = p.vendors.map((v) => {
        if (v.id !== action.vendorId) return v;
        return {
          ...v,
          payments: [...v.payments, action.payment],
        };
      });
      return {
        ...state,
        plan: { ...p, vendors },
        toast: { message: 'Payment milestone added.', type: 'success' },
      };
    }

    case 'togglePayment': {
      const vendors = p.vendors.map((v) => {
        if (v.id !== action.vendorId) return v;
        const payments = v.payments.map((pm) => {
          if (pm.id !== action.paymentId) return pm;
          const nextStatus = pm.status === 'paid' ? 'pending' : 'paid';
          return {
            ...pm,
            status: nextStatus as 'paid' | 'pending',
            paidDate: nextStatus === 'paid' ? new Date().toISOString().slice(0, 10) : undefined,
          };
        });
        return { ...v, payments };
      });
      return { ...state, plan: { ...p, vendors } };
    }

    case 'addStoredQuote': {
      const quotes = [...(p.quotes ?? []), action.stored];
      return {
        ...state,
        plan: { ...p, quotes },
        toast: { message: 'Quotation saved for comparison.', type: 'success' },
      };
    }

    case 'acceptStoredQuote': {
      const quotes = (p.quotes ?? []).map((q) => ({
        ...q,
        accepted: q.id === action.quoteId,
      }));
      return {
        ...state,
        plan: { ...p, quotes },
        toast: { message: 'Quotation accepted and marked verified!', type: 'success' },
      };
    }

    case 'deleteStoredQuote': {
      const quotes = (p.quotes ?? []).filter((q) => q.id !== action.quoteId);
      return { ...state, plan: { ...p, quotes } };
    }

    case 'cycleRunSheet': {
      const runSheet = p.runSheet.map((item) => {
        if (item.id !== action.itemId) return item;
        let nextStatus: RunSheetItem['status'] = 'in_progress';
        if (item.status === 'in_progress') nextStatus = 'completed';
        else if (item.status === 'completed') nextStatus = 'pending';
        return { ...item, status: nextStatus };
      });
      return { ...state, plan: { ...p, runSheet } };
    }

    case 'addRunSheetItem': {
      const runSheet = [...p.runSheet, action.item];
      return { ...state, plan: { ...p, runSheet } };
    }

    case 'updateIntake': {
      const allocation = allocate(action.intake.totalBudget, action.intake.occasion, action.intake.priorities);
      const perPlate = action.intake.guests > 0 ? Math.round(allocation.catering / action.intake.guests) : 1000;
      const updated: Plan = {
        ...p,
        occasion: action.intake.occasion,
        totalBudget: action.intake.totalBudget,
        guests: action.intake.guests,
        eventDate: action.intake.eventDate,
        city: action.intake.city,
        vibe: action.intake.vibe ?? p.vibe,
        priorities: action.intake.priorities,
        priorityKeys: action.intake.priorityKeys ?? p.priorityKeys,
        allocation,
        perPlate,
      };
      return {
        ...state,
        plan: updated,
        toast: { message: 'Celebration vision updated & budget recalculated!', type: 'success' },
      };
    }

    case 'addSiteVisit': {
      const siteVisits = [...(p.siteVisits ?? []), action.visit];
      return {
        ...state,
        plan: { ...p, siteVisits },
        toast: { message: `Logged site visit to "${action.visit.venueName}".`, type: 'success' },
      };
    }

    case 'updateSiteVisit': {
      const siteVisits = (p.siteVisits ?? []).map((v) => (v.id === action.visit.id ? action.visit : v));
      return { ...state, plan: { ...p, siteVisits } };
    }

    case 'deleteSiteVisit': {
      const siteVisits = (p.siteVisits ?? []).filter((v) => v.id !== action.visitId);
      return { ...state, plan: { ...p, siteVisits } };
    }

    case 'addVendorMeeting': {
      const vendorMeetings = [...(p.vendorMeetings ?? []), action.meeting];
      return {
        ...state,
        plan: { ...p, vendorMeetings },
        toast: { message: `Logged tasting/meeting with "${action.meeting.vendorName}".`, type: 'success' },
      };
    }

    case 'updateVendorMeeting': {
      const vendorMeetings = (p.vendorMeetings ?? []).map((m) => (m.id === action.meeting.id ? action.meeting : m));
      return { ...state, plan: { ...p, vendorMeetings } };
    }

    case 'deleteVendorMeeting': {
      const vendorMeetings = (p.vendorMeetings ?? []).filter((m) => m.id !== action.meetingId);
      return { ...state, plan: { ...p, vendorMeetings } };
    }

    case 'applyTradeoff': {
      const updated = applyOption(p, action.optionId);
      return {
        ...state,
        plan: updated,
        toast: { message: 'Trade-off option applied successfully.', type: 'success' },
      };
    }

    default:
      return state;
  }
}

/**
 * Loads plan from URL hash or localStorage.
 */
export function getInitialPlan(): Plan | null {
  // 1. Try URL hash share link
  if (typeof window !== 'undefined' && window.location.hash) {
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('plan=')) {
        const base64 = decodeURIComponent(hash.replace(/^plan=/, ''));
        const json = atob(base64);
        const parsed = JSON.parse(json);
        const valid = PlanSchema.safeParse(parsed);
        if (valid.success) return valid.data;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // 2. Try localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const valid = PlanSchema.safeParse(parsed);
        if (valid.success) return valid.data;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Encodes plan to base64 share link.
 */
export function encodePlanShareLink(plan: Plan): string {
  try {
    const json = JSON.stringify(plan);
    const b64 = btoa(json);
    return `${window.location.origin}${window.location.pathname}#plan=${encodeURIComponent(b64)}`;
  } catch {
    return window.location.href;
  }
}

export function usePlanStore() {
  const [state, dispatch] = useReducer(planReducer, null, () => ({
    plan: getInitialPlan(),
    toast: null,
  }));

  // Autosave to localStorage on every change
  useEffect(() => {
    if (state.plan) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.plan));
      } catch {
        // Storage quota full or unavailable
      }
    }
  }, [state.plan]);

  const clearToast = useCallback(() => {
    dispatch({ type: 'loadPlan', plan: state.plan! });
  }, [state.plan]);

  return {
    state,
    dispatch,
    clearToast,
  };
}
