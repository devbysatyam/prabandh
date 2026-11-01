import type { Occasion, RunSheetItem } from '../../schemas';

/** Day-of run-sheet templates per occasion (ids/status assigned when a plan is created). */
export const OCCASION_RUNSHEET: Record<Occasion, Omit<RunSheetItem, 'id' | 'status'>[]> = {
  wedding: [
    {
      time: '08:00',
      title: 'Haldi & Chooda Rituals',
      description: 'Immediate family gathering at residence/suite',
      coordinator: 'Mami & Chachi',
    },
    {
      time: '11:30',
      title: 'Bridal & Groom Makeup Starts',
      description: 'Artist arrives at venue bridal room',
      coordinator: 'Sister / Best Friend',
    },
    {
      time: '14:30',
      title: 'Caterer High Tea & Chaat Counter Opens',
      description: 'Welcome snacks for outstation guests',
      coordinator: 'Catering Lead',
    },
    {
      time: '16:00',
      title: 'Baraat Assembly & Dhol Procession',
      description: 'Baraat starts from entrance gate',
      coordinator: 'Groom Uncle & Brother',
    },
    {
      time: '17:30',
      title: 'Milni & Varmala Ceremony',
      description: 'Floral exchange on central stage',
      coordinator: 'Stage Coordinator',
    },
    {
      time: '19:00',
      title: 'Main Banquet Dinner Buffet Opens',
      description: 'Full dining hall operational',
      coordinator: 'Catering In-Charge',
    },
    {
      time: '20:30',
      title: 'Pheras & Kanyadaan Muhurat',
      description: 'Mandap sacred rituals with Pandit ji',
      coordinator: 'Pandit Ji & Parents',
    },
    {
      time: '23:30',
      title: 'Vidaai Ceremony',
      description: 'Farewell ceremony and car departure',
      coordinator: 'Bride Family Elders',
    },
  ],
  kids_birthday: [
    {
      time: '16:00',
      title: 'Venue Setup & Balloon Decor Verification',
      description: 'Ensure backdrop and photo booth are ready',
      coordinator: 'Host',
    },
    {
      time: '17:00',
      title: 'Guest Arrival & Welcome Mocktails/Fries',
      description: 'Tattoo artist and welcome music',
      coordinator: 'Party Host',
    },
    {
      time: '17:45',
      title: 'Interactive Party Games & Musical Chairs',
      description: 'Kids game host takes over',
      coordinator: 'Game Coordinator',
    },
    {
      time: '18:45',
      title: 'Magic Show / Puppet Performance',
      description: '30-minute central performance',
      coordinator: 'Magician',
    },
    {
      time: '19:30',
      title: 'Grand Cake Cutting Ceremony',
      description: 'Candles, birthday song, and cake distribution',
      coordinator: 'Parents',
    },
    {
      time: '20:00',
      title: 'Dinner Buffet & Return Gift Distribution',
      description: 'Hot dinner served; return gifts handed out',
      coordinator: 'Co-Host',
    },
  ],
  milestone: [
    {
      time: '11:00',
      title: 'Guest Arrival & Welcome Drinks',
      description: 'Acoustic background music and guest book signing',
      coordinator: 'Host',
    },
    {
      time: '12:00',
      title: 'Welcome Speech & Garland Felicitations',
      description: 'Honoring the milestone celebrants',
      coordinator: 'Family MC',
    },
    {
      time: '12:30',
      title: 'AV Nostalgia Video Tribute & Photo Reel',
      description: 'Projector screening of memorable life moments',
      coordinator: 'AV Tech',
    },
    {
      time: '13:00',
      title: 'Celebratory Toast & Cake Cutting',
      description: 'Family speeches and cake cutting',
      coordinator: 'Eldest Sibling',
    },
    {
      time: '13:30',
      title: 'Grand Multi-Cuisine Luncheon',
      description: 'Full buffet open with dedicated elder table service',
      coordinator: 'Catering Lead',
    },
    {
      time: '15:30',
      title: 'Live Music Session & Guest Mingling',
      description: 'Old classics and evergreen melodies',
      coordinator: 'Music Coordinator',
    },
  ],
  community: [
    {
      time: '08:00',
      title: 'Stage Setup & Audio / Mic Testing',
      description: 'Check sound levels and backup power generator',
      coordinator: 'Sound Tech',
    },
    {
      time: '09:30',
      title: 'Inauguration & Lamp Lighting Ceremony',
      description: 'Community leaders and VIP welcome',
      coordinator: 'Committee Lead',
    },
    {
      time: '10:30',
      title: 'Cultural Performances / Bhajan Session',
      description: 'Local youth and artist group showcases',
      coordinator: 'Cultural Head',
    },
    {
      time: '12:30',
      title: 'Community Mahaprasad / Bhandara Lunch',
      description: 'Organized row dining service for community members',
      coordinator: 'Prasad In-Charge',
    },
    {
      time: '15:00',
      title: 'Volunteer Shift Rotation & Cleanup Round',
      description: 'Waste segregation and venue upkeep',
      coordinator: 'Youth Volunteers',
    },
    {
      time: '17:30',
      title: 'Evening Aarti / Gala Grand Finale',
      description: 'Closing ceremony and vote of thanks',
      coordinator: 'Secretary',
    },
  ],
};
