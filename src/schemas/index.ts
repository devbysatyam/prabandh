import { z } from 'zod';

export const CATEGORIES = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'misc',
  'contingency',
] as const;
export const CategorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof CategorySchema>;

export const OCCASIONS = ['wedding', 'kids_birthday', 'milestone', 'community'] as const;
export const OccasionSchema = z.enum(OCCASIONS);
export type Occasion = z.infer<typeof OccasionSchema>;

export const MAX_GUESTS = 100_000;
export const MAX_BUDGET = 100_000_000_000;

export const AllocationSchema = z.object({
  venue: z.number().int().min(0).max(MAX_BUDGET),
  catering: z.number().int().min(0).max(MAX_BUDGET),
  decor: z.number().int().min(0).max(MAX_BUDGET),
  photography: z.number().int().min(0).max(MAX_BUDGET),
  entertainment: z.number().int().min(0).max(MAX_BUDGET),
  misc: z.number().int().min(0).max(MAX_BUDGET),
  contingency: z.number().int().min(0).max(MAX_BUDGET),
});
export type Allocation = z.infer<typeof AllocationSchema>;

export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'delayed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPhaseSchema = z.enum(['foundation', 'vendor_booking', 'creative_invites', 'final_prep', 'event_week']);
export type TaskPhase = z.infer<typeof TaskPhaseSchema>;

export const TaskSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  category: CategorySchema,
  leadDays: z.number().int().min(0).max(1000),
  durationDays: z.number().int().min(0).max(120),
  dependsOn: z.array(z.string()).max(20),
  assignee: z.string().max(80).optional(),
  status: TaskStatusSchema,
  delayDays: z.number().int().min(0).max(365).optional(),
  phase: TaskPhaseSchema.optional(),
});
export type Task = z.infer<typeof TaskSchema>;

/* Guest List & RSVP Schemas */
export const GuestSideSchema = z.enum(['bride', 'groom', 'mutual', 'community', 'general']);
export type GuestSide = z.infer<typeof GuestSideSchema>;

export const RsvpStatusSchema = z.enum(['confirmed', 'pending', 'declined']);
export type RsvpStatus = z.infer<typeof RsvpStatusSchema>;

export const DietPreferenceSchema = z.enum(['veg', 'jain', 'non_veg', 'any']);
export type DietPreference = z.infer<typeof DietPreferenceSchema>;

export const GuestSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  count: z.number().int().min(1).max(50),
  side: GuestSideSchema.default('general'),
  rsvp: RsvpStatusSchema.default('pending'),
  diet: DietPreferenceSchema.default('veg'),
  phone: z.string().max(30).optional(),
  notes: z.string().max(300).optional(),
});
export type Guest = z.infer<typeof GuestSchema>;

/* Venue Management Schemas */
export const VenueTypeSchema = z.enum([
  'banquet_hall',
  'outdoor_lawn',
  'heritage_resort',
  'hotel_ballroom',
  'community_hall',
]);
export type VenueType = z.infer<typeof VenueTypeSchema>;

export const CateringPolicySchema = z.enum([
  'in_house_mandatory',
  'external_allowed',
  'royalty_fee',
]);
export type CateringPolicy = z.infer<typeof CateringPolicySchema>;

export const VenueDetailSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  type: VenueTypeSchema.default('banquet_hall'),
  capacityMin: z.number().int().min(0).default(50),
  capacityMax: z.number().int().min(0).default(500),
  rentalCost: z.number().int().min(0).default(0),
  cateringPolicy: CateringPolicySchema.default('external_allowed'),
  alcoholAllowed: z.boolean().default(false),
  parkingCapacity: z.number().int().min(0).default(50),
  roomsIncluded: z.number().int().min(0).default(2),
  curfewTime: z.string().max(20).default('23:00'),
  cautionDeposit: z.number().int().min(0).default(25000),
  address: z.string().max(300).optional(),
  status: z.enum(['shortlisted', 'visited', 'booked']).default('shortlisted'),
  notes: z.string().max(500).optional(),
});
export type VenueDetail = z.infer<typeof VenueDetailSchema>;

/* Venue Site Visit / Recce Schemas */
export const SiteVisitSchema = z.object({
  id: z.string().min(1).max(50),
  venueId: z.string().min(1).max(50),
  venueName: z.string().min(1).max(150),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  attendees: z.string().max(200),
  rating: z.number().int().min(1).max(5).default(4),
  acWorking: z.boolean().default(true),
  bridalRoomClean: z.boolean().default(true),
  soundCurfewOk: z.boolean().default(true),
  parkingAdequate: z.boolean().default(true),
  tastingDone: z.boolean().default(false),
  tastingNotes: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['scheduled', 'completed', 'followup_needed']).default('completed'),
});
export type SiteVisit = z.infer<typeof SiteVisitSchema>;

/* Vendor & Payment Tracking Schemas */
export const VendorStatusSchema = z.enum(['shortlisted', 'contacted', 'quoted', 'booked']);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const QuoteSchema = z.object({
  vendorName: z.string().max(120).nullable(),
  category: CategorySchema,
  totalPrice: z.number().int().min(0).max(MAX_BUDGET).nullable(),
  pricePerPlate: z.number().int().min(0).max(MAX_BUDGET).nullable(),
  guestMinimum: z.number().int().min(0).max(MAX_GUESTS).nullable(),
  overtimeFeePerHour: z.number().int().min(0).max(MAX_BUDGET).nullable(),
  taxIncluded: z.boolean().nullable(),
  advancePercent: z.number().min(0).max(100).nullable(),
  inclusions: z.array(z.string().max(200)).max(30),
  exclusions: z.array(z.string().max(200)).max(30),
  cancellationPolicy: z.string().max(400).nullable(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const StoredQuoteSchema = z.object({
  id: z.string().min(1).max(50),
  category: CategorySchema,
  quote: QuoteSchema,
  accepted: z.boolean().default(false),
});
export type StoredQuote = z.infer<typeof StoredQuoteSchema>;

export const PaymentMilestoneSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(150),
  amount: z.number().int().min(0).max(MAX_BUDGET),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  status: z.enum(['pending', 'paid']),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type PaymentMilestone = z.infer<typeof PaymentMilestoneSchema>;

export const VendorSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  category: CategorySchema,
  status: VendorStatusSchema,
  phone: z.string().max(30).optional(),
  email: z.string().max(100).optional(),
  quote: QuoteSchema.nullable().optional(),
  payments: z.array(PaymentMilestoneSchema).default([]),
  notes: z.string().max(500).optional(),
});
export type Vendor = z.infer<typeof VendorSchema>;

/* Vendor In-Person Meeting & Tasting Visit Schemas */
export const VendorMeetingSchema = z.object({
  id: z.string().min(1).max(50),
  vendorId: z.string().min(1).max(50),
  vendorName: z.string().min(1).max(150),
  category: CategorySchema,
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  meetingType: z.enum(['food_tasting', 'makeup_trial', 'decor_mockup', 'sound_check', 'contract_discussion']),
  attendees: z.string().max(200),
  rating: z.number().int().min(1).max(5).default(4),
  dishesOrItemsTested: z.string().max(300).optional(),
  feedback: z.string().max(1000),
  status: z.enum(['scheduled', 'completed', 'followup_needed']).default('completed'),
});
export type VendorMeeting = z.infer<typeof VendorMeetingSchema>;

/* Day-of Run Sheet Schemas */
export const RunSheetItemSchema = z.object({
  id: z.string().min(1).max(50),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format'),
  title: z.string().min(1).max(150),
  description: z.string().max(300).optional(),
  coordinator: z.string().max(100).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
});
export type RunSheetItem = z.infer<typeof RunSheetItemSchema>;

/* Priority Items Definition */
export const PRIORITY_ITEMS = [
  {
    id: 'catering',
    label: 'Royal Feast & Catering',
    category: 'catering' as Category,
    icon: '🍲',
    desc: 'Live chaat counters, regional specialties, Awadhi banquet & hot artisanal sweets',
  },
  {
    id: 'venue',
    label: 'Grand Venue & Lawn',
    category: 'venue' as Category,
    icon: '🏛️',
    desc: 'Heritage palace, expansive lush lawn, luxury AC ballroom with ample parking',
  },
  {
    id: 'decor',
    label: 'Floral Mandap & Grand Lighting',
    category: 'decor' as Category,
    icon: '🌸',
    desc: 'Fresh fragrant marigolds, imported exotic florals, brass urlis & fairy light canopies',
  },
  {
    id: 'photography',
    label: 'Cinematography & Candid Photo',
    category: 'photography' as Category,
    icon: '📸',
    desc: '4K drone cinematography, candid portraiture, pre-wedding & same-day trailer edits',
  },
  {
    id: 'entertainment',
    label: 'DJ, Sangeet & Live Acts',
    category: 'entertainment' as Category,
    icon: '🎵',
    desc: 'Celebrity DJ, Punjabi dhol troupe, live acoustic Sufi ensemble & choreographers',
  },
  {
    id: 'styling',
    label: 'Bridal Styling & Mehendi',
    category: 'misc' as Category,
    icon: '💄',
    desc: 'Luxury bridal makeup artist (MUA), organic bridal henna/mehendi, groom safa styling',
  },
  {
    id: 'hospitality',
    label: 'Guest Stay & Transit Logistics',
    category: 'venue' as Category,
    icon: '🏨',
    desc: 'AC room blocks for outstation families, welcome hampers & round-the-clock transit cabs',
  },
  {
    id: 'favors',
    label: 'Gifts, Mithai & Return Favors',
    category: 'misc' as Category,
    icon: '🎁',
    desc: 'Custom silver coins, luxury dry fruit gift boxes & personalized return hampers',
  },
  {
    id: 'pooja',
    label: 'Vedic Rituals & Samagri',
    category: 'misc' as Category,
    icon: '🪔',
    desc: 'Revered Pandit ji, auspicious muhurat coordination, havan kund & sacred pooja samagri',
  },
] as const;

export type PriorityId = (typeof PRIORITY_ITEMS)[number]['id'];

/* Main Plan Schema */
export const PlanSchema = z.object({
  id: z.string().min(1).max(50),
  version: z.literal(1),
  title: z.string().min(1).max(200),
  occasion: OccasionSchema,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
  totalBudget: z.number().int().min(1).max(MAX_BUDGET),
  guests: z.number().int().min(1).max(MAX_GUESTS),
  vibe: z.string().max(300),
  city: z.string().max(100).optional(),
  priorities: z.array(CategorySchema).max(7),
  priorityKeys: z.array(z.string()).default([]),
  allocation: AllocationSchema,
  locked: z.array(CategorySchema).max(7),
  contacted: z.array(CategorySchema).default([]),
  perPlate: z.number().min(0).max(MAX_BUDGET),
  tasks: z.array(TaskSchema).max(100),
  guestList: z.array(GuestSchema).max(1000).default([]),
  vendors: z.array(VendorSchema).max(50).default([]),
  venues: z.array(VenueDetailSchema).max(20).default([]),
  siteVisits: z.array(SiteVisitSchema).max(50).default([]),
  quotes: z.array(StoredQuoteSchema).max(30).default([]),
  vendorMeetings: z.array(VendorMeetingSchema).max(50).default([]),
  runSheet: z.array(RunSheetItemSchema).max(100).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;

/* Intake Schema */
export const IntakeSchema = z.object({
  occasion: OccasionSchema,
  totalBudget: z.number().int().min(1).max(MAX_BUDGET),
  guests: z.number().int().min(1).max(MAX_GUESTS),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vibe: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  priorities: z.array(CategorySchema.exclude(['contingency'])).max(6),
  priorityKeys: z.array(z.string()).optional(),
});
export type Intake = z.infer<typeof IntakeSchema>;

/* AI Exchange Schemas */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(2000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const IdeasResponseSchema = z.object({
  themes: z.array(z.object({ title: z.string(), description: z.string() })).max(6),
  activities: z.array(z.string()).max(8),
  foodStyle: z.array(z.string()).max(8),
  personalTouches: z.array(z.string()).max(6),
  invitationLine: z.string(),
});
export type IdeasResponse = z.infer<typeof IdeasResponseSchema>;

export const PlanReviewSchema = z.object({
  summary: z.string(),
  healthScore: z.number().min(0).max(100),
  topRisks: z.array(z.string()).max(4),
  recommendedActions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
    }),
  ).max(4),
});
export type PlanReview = z.infer<typeof PlanReviewSchema>;
