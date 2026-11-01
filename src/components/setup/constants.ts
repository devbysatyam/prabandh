import type { Occasion } from '../../schemas';

/** Quick-fill example descriptions for the natural-language intake. */
export const PRESET_EXAMPLES: readonly { label: string; text: string }[] = [
  {
    label: 'Grand Pune Shaadi (200 guests, ₹15 Lakh)',
    text: 'Grand Punjabi Shaadi in Pune, 200 guests, 15 lakh budget, late December. We care most about royal catering and candid cinematography.',
  },
  {
    label: "Kid's 7th Birthday Party (60 guests, ₹85,000)",
    text: 'Superhero themed 7th birthday celebration for my son, 60 guests, 85000 budget, next month. Games, magic show, and delicious snack boxes are top priorities.',
  },
  {
    label: 'Parents 50th Golden Anniversary (120 guests, ₹6 Lakh)',
    text: 'Golden Jubilee 50th Wedding Anniversary for parents, 120 guests, 6 lakh budget. Warm nostalgic vibe, acoustic ghazals, memory tribute, and comfortable elder seating.',
  },
  {
    label: 'Community Diwali Utsav (500 guests, ₹4 Lakh)',
    text: 'Society Diwali & Cultural Festival, 500 guests, 4 lakh budget. Focus on community bhandara feast, stage lightings, and security permits.',
  },
];

/** Selectable occasion cards. */
export const OCCASION_CHOICES: readonly {
  id: Occasion;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { id: 'wedding', label: 'Wedding / Shaadi', icon: '💍', desc: 'Sangeet, Mandap, Feast' },
  { id: 'kids_birthday', label: "Kid's Birthday", icon: '🎂', desc: 'Themes, Games, Cakes' },
  { id: 'milestone', label: 'Milestone Jubilee', icon: '🏆', desc: '50th/60th, AV Tribute' },
  { id: 'community', label: 'Community Gala', icon: '🪔', desc: 'Festivals & Bhandaras' },
];

/** Form defaults. */
export const DEFAULT_OCCASION: Occasion = 'wedding';
export const DEFAULT_BUDGET = '1500000';
export const DEFAULT_GUESTS = 200;
export const DEFAULT_VIBE = 'Warm, elegant celebration with close family and delicious royal food';
export const DEFAULT_CITY = 'Pune';
export const DEFAULT_PRIORITY_KEYS: readonly string[] = ['catering', 'photography'];
/** Months ahead of today used for the default celebration date. */
export const DEFAULT_EVENT_LEAD_MONTHS = 4;

/** Submission limits and fallbacks. */
export const MIN_BUDGET = 10_000;
export const FALLBACK_BUDGET = 1_000_000;
export const MIN_GUESTS = 1;
export const MAX_GUESTS_INPUT = 100_000;
export const FALLBACK_PRIORITY = 'catering' as const;

/** Rough share of the budget spent on catering, used for the per-plate hint. */
export const CATERING_BUDGET_SHARE = 0.35;
