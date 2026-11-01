import type { Category, Occasion } from '../../schemas';

/** Display name of each budget category, per occasion. */
export const OCCASION_LABELS: Record<Occasion, Record<Category, string>> = {
  wedding: {
    venue: 'Wedding & Reception Venue',
    catering: 'Royal Banquet & Feasts',
    decor: 'Mandap, Floral & Lighting',
    photography: 'Candid Photo & Cinematic Film',
    entertainment: 'Sangeet, DJ & Dhol',
    misc: 'Mehendi, Pandit & Pooja Items',
    contingency: 'Emergency Buffer (10%)',
  },
  kids_birthday: {
    venue: 'Party Hall / Play Zone',
    catering: 'Kids & Adult Snacks & Cake',
    decor: 'Balloon Arch & Theme Decor',
    photography: 'Event Photography',
    entertainment: 'Games, Magic Show & Mascot',
    misc: 'Return Gifts & Goodie Bags',
    contingency: 'Emergency Buffer (10%)',
  },
  milestone: {
    venue: 'Banquet Hall / Lawn',
    catering: 'Curated Lunch / Dinner Buffet',
    decor: 'Elegant Stage & Memory Walkway',
    photography: 'Portraits & Family Video',
    entertainment: 'AV Tribute, Speeches & Live Music',
    misc: 'Mementos & Guest Honors',
    contingency: 'Emergency Buffer (10%)',
  },
  community: {
    venue: 'Community Ground / Pandal',
    catering: 'Community Bhandara / Prasad',
    decor: 'Stage, Pandal & Festoon Lighting',
    photography: 'Coverage & Press Snaps',
    entertainment: 'Sound, Stage & Cultural Acts',
    misc: 'Police Permits, Waste & Security',
    contingency: 'Emergency Buffer (10%)',
  },
};

/** Default budget share (percent) of each category, per occasion. */
export const OCCASION_PRESETS: Record<Occasion, Record<Category, number>> = {
  wedding: {
    venue: 20,
    catering: 35,
    decor: 12,
    photography: 10,
    entertainment: 8,
    misc: 5,
    contingency: 10,
  },
  kids_birthday: {
    venue: 15,
    catering: 30,
    decor: 15,
    photography: 5,
    entertainment: 20,
    misc: 5,
    contingency: 10,
  },
  milestone: {
    venue: 20,
    catering: 35,
    decor: 10,
    photography: 10,
    entertainment: 10,
    misc: 5,
    contingency: 10,
  },
  community: {
    venue: 20,
    catering: 25,
    decor: 15,
    photography: 5,
    entertainment: 15,
    misc: 10,
    contingency: 10,
  },
};
