import type { VenueDetail } from '../schemas';

export interface VenueEvaluation {
  venue: VenueDetail;
  capacityStatus: 'optimal' | 'cramped' | 'excessive';
  capacityMessage: string;
  totalEstimatedCost: number;
  policyNotes: string[];
  isSuitableForGuests: boolean;
}

/**
 * Evaluates a venue's capacity, cost, and policies against target guest count.
 */
export function evaluateVenue(venue: VenueDetail, guestCount: number): VenueEvaluation {
  let capacityStatus: 'optimal' | 'cramped' | 'excessive' = 'optimal';
  let capacityMessage = `Perfect fit for ${guestCount} guests (capacity: ${venue.capacityMin}–${venue.capacityMax}).`;
  let isSuitableForGuests = true;

  if (guestCount > venue.capacityMax) {
    capacityStatus = 'cramped';
    capacityMessage = `Warning: Your guest list (${guestCount}) exceeds venue maximum capacity (${venue.capacityMax}). Venue will feel overcrowded.`;
    isSuitableForGuests = false;
  } else if (guestCount < venue.capacityMin) {
    capacityStatus = 'excessive';
    capacityMessage = `Notice: Your guest list (${guestCount}) is below the venue minimum requirement of ${venue.capacityMin} guests.`;
  }

  // Calculate estimated total including caution deposit and taxes
  const totalEstimatedCost = venue.rentalCost + venue.cautionDeposit;

  const policyNotes: string[] = [];

  // Catering policy
  if (venue.cateringPolicy === 'in_house_mandatory') {
    policyNotes.push('In-house catering is mandatory. Outside caterers not permitted.');
  } else if (venue.cateringPolicy === 'royalty_fee') {
    policyNotes.push('Outside caterers allowed subject to kitchen royalty fee.');
  } else {
    policyNotes.push('Outside caterers welcome without additional royalty.');
  }

  // Curfew
  policyNotes.push(`Outdoor amplified sound curfew strictly at ${venue.curfewTime}.`);

  // Rooms
  policyNotes.push(`${venue.roomsIncluded} air-conditioned green/bridal rooms included in booking.`);

  // Alcohol
  if (venue.alcoholAllowed) {
    policyNotes.push('Liquor allowed with standard one-day state excise permit.');
  } else {
    policyNotes.push('Dry venue: alcohol strictly prohibited on premises.');
  }

  // Parking
  policyNotes.push(`Valet & parking space for ~${venue.parkingCapacity} vehicles.`);

  return {
    venue,
    capacityStatus,
    capacityMessage,
    totalEstimatedCost,
    policyNotes,
    isSuitableForGuests,
  };
}

/**
 * Generates ready-to-send WhatsApp enquiry text for a shortlisted venue.
 */
export function formatVenueWhatsappInquiry(
  venue: VenueDetail,
  eventDate: string,
  guestCount: number,
  eventTitle: string,
): string {
  const dateFormatted = new Date(eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `Namaste Management at ${venue.name}! 🙏\n\nWe are planning ${eventTitle} on ${dateFormatted} and are considering your esteemed property for our celebration.\n\nKey Details:\n• Target Guest Count: ${guestCount} guests\n• Preferred Space: ${venue.type.replace('_', ' ').toUpperCase()}\n\nCould you please confirm availability for ${dateFormatted} and share:\n1. Base hall/lawn rental rates and current package inclusions\n2. In-house catering per-plate pricing or kitchen royalty charges for outside caterers\n3. Caution deposit and booking token percentage\n4. Curfew guidelines for music/sound\n\nWe would love to schedule a property walkthrough this week.\n\nWarm regards,\nHost Family`;
}
