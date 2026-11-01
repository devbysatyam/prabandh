import type { Guest, Intake, Plan, SiteVisit, VendorMeeting, VenueDetail } from '../schemas';
import { createDefaultPlan, isoToday } from './planFactory';

const SAMPLE_EVENT_LEAD_MONTHS = 4;

const SAMPLE_VENUE_1: VenueDetail = {
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
  notes:
    'Breathtaking 100-year-old banyan tree mandap area with attached air-conditioned banquet hall.',
};

const SAMPLE_VENUE_2: VenueDetail = {
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

const SAMPLE_GUESTS: Guest[] = [
  {
    id: 'g-1',
    name: 'Sharma Family (Groom Parents & Sister)',
    count: 4,
    side: 'groom',
    rsvp: 'confirmed',
    diet: 'veg',
    phone: '+91 98230 11223',
  },
  {
    id: 'g-2',
    name: 'Verma Family (Bride Parents & Didi)',
    count: 5,
    side: 'bride',
    rsvp: 'confirmed',
    diet: 'veg',
    phone: '+91 98901 44556',
  },
  {
    id: 'g-3',
    name: 'Rajesh & Sunita Kulkarni (Maternal Uncle)',
    count: 3,
    side: 'groom',
    rsvp: 'confirmed',
    diet: 'jain',
    phone: '+91 94220 77889',
  },
  {
    id: 'g-4',
    name: 'Dr. Anand Joshi & Family',
    count: 4,
    side: 'mutual',
    rsvp: 'pending',
    diet: 'veg',
    phone: '+91 98225 33445',
  },
  {
    id: 'g-5',
    name: 'College Friends Group (Dev, Rohan, Priya)',
    count: 6,
    side: 'groom',
    rsvp: 'confirmed',
    diet: 'any',
    phone: '+91 97654 11220',
  },
  {
    id: 'g-6',
    name: 'Office Team (Satyam, Anjali, Vicky)',
    count: 5,
    side: 'bride',
    rsvp: 'pending',
    diet: 'veg',
    phone: '+91 99221 88990',
  },
];

/** Completed site visit to the first sample venue, dated `today`. */
function sampleSiteVisit(today: string): SiteVisit {
  return {
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
    tastingNotes:
      'Tasted Gulab Jamun, live chaat, and Paneer Tikka. Exceptional quality and prompt service.',
    notes:
      'Checked power backup generator. Verified 4 bridal rooms with attached restrooms. Manager agreed to 25% token advance.',
    status: 'completed',
  };
}

/** Completed food-tasting meeting with the sample caterer, dated `today`. */
function sampleVendorMeeting(today: string): VendorMeeting {
  return {
    id: 'vm-sample-1',
    vendorId: 'v-2',
    vendorName: 'Royal Awadhi Master Caterers',
    category: 'catering',
    meetingDate: today,
    meetingType: 'food_tasting',
    attendees: 'Both Families (6 members)',
    rating: 5,
    dishesOrItemsTested: 'Dal Bukhara, Paneer Lababdar, Live Jalebi & Rabdi, Dahi Bhalla',
    feedback:
      'Food was delicious. Requested slightly less spice in Dal Makhani for elderly guests. Head chef Ramesh agreed.',
    status: 'completed',
  };
}

/**
 * Curated demo plan used by "Load sample" and by tests.
 *
 * @param today - Reference date (defaults to today); the event is set four months later.
 * @returns A populated wedding plan with venues, a site visit, guests and a tasting.
 * @example
 * ```ts
 * createSamplePlan('2026-11-02').city; // => 'Pune'
 * ```
 */
export function createSamplePlan(today: string = isoToday()): Plan {
  const d = new Date(today);
  d.setMonth(d.getMonth() + SAMPLE_EVENT_LEAD_MONTHS);
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

  return {
    ...plan,
    title: 'Sharma & Verma Grand Royal Wedding',
    venues: [SAMPLE_VENUE_1, SAMPLE_VENUE_2],
    siteVisits: [sampleSiteVisit(today)],
    guestList: SAMPLE_GUESTS,
    vendorMeetings: [sampleVendorMeeting(today)],
  };
}
