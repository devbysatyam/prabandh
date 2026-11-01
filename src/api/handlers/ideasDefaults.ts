import type { IdeasResponse } from '../../schemas';

/** High-quality default suggestions used when Gemini is unavailable. */
export const DEFAULT_IDEAS: IdeasResponse = {
  themes: [
    {
      title: 'Royal Marigold & Brass Elegance',
      description:
        'Timeless traditional celebration with scented genda phool cascades, antique brass urlis, and warm fairy lights.',
    },
    {
      title: 'Modern Pastel Garden Fairytale',
      description:
        'Soft blush pinks, sage greens, and delicate floral canopies ideal for open-air afternoon and sunset gatherings.',
    },
    {
      title: 'Vibrant Sangeet Carnivale',
      description:
        'High energy colourful drapery, neon sign photo-booths, interactive dhol entry, and fusion street-food stalls.',
    },
  ],
  activities: [
    'Family trivia game featuring childhood and relationship stories',
    'Live acoustic ghazal and Bollywood unplugged counter',
    'Personalized polaroid guestbook with handwritten blessings',
    'Custom bangle & ittar perfume making stall for guests',
  ],
  foodStyle: [
    'Live Amritsari kulcha and wood-fired chaat street cart',
    'Slow-cooked traditional Dal Makhani & Awadhi Biryani buffet',
    'Artisanal Indian dessert bar: hot jalebi with rabdi & kulfi falooda',
    'Welcome spiced saffron kahwa and chilled coconut water bar',
  ],
  personalTouches: [
    'Handwritten welcome notes for outstation guests in hotel rooms',
    'Curated heirloom recipe included on the wedding menu',
    'Family archival photo memory wall along the entrance walkway',
  ],
  invitationLine:
    'With hearts full of joy and gratitude, we invite you to bless our family as we celebrate together on this auspicious day.',
};
