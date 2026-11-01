import {
  CATEGORIES,
  type Category,
  type Occasion,
  type Plan,
  type Quote,
  type Vendor,
} from '../schemas';
import { formatINR } from './money';
import { OCCASION_LABELS } from './presets';

export interface QuoteComparison {
  effectiveCost: number;
  categoryBudget: number;
  variance: number;
  isOverBudget: boolean;
  flags: {
    type: 'warn' | 'info' | 'good';
    code: string;
    message: string;
  }[];
}

export interface PaymentSummary {
  totalAgreed: number;
  totalPaid: number;
  balanceRemaining: number;
  paidPercentage: number;
  nextMilestone: {
    title: string;
    amount: number;
    dueDate: string;
  } | null;
}

export type ChecklistStatus = 'not_started' | 'contacted' | 'quoted' | 'booked';

export interface VendorChecklistItem {
  category: Category;
  label: string;
  hint: string;
  status: ChecklistStatus;
  quotesCount: number;
  hasAcceptedQuote: boolean;
  contacted: boolean;
}

const VENDOR_CATEGORY_HINTS: Record<Occasion, Record<Category, string>> = {
  wedding: {
    venue: 'Heritage palace, banquet hall, or sprawling lawn with parking',
    catering: 'Royal banquet catering, multi-cuisine live counters, and mithai',
    decor: 'Mandap, imported floral canopies, stage lighting, and walkway',
    photography: 'Candid wedding photography, cinematic drone film & teaser',
    entertainment: 'Sangeet choreographer, celebrity DJ, and live Punjabi dhol',
    misc: 'Bridal makeup artist (MUA), mehendi artist, Pandit ji & samagri',
    contingency: 'Safety buffer reserved for last-minute emergency requirements',
  },
  kids_birthday: {
    venue: 'Party hall, outdoor garden lawn, or children play zone',
    catering: 'Themed birthday cake, live burger/pizza stalls & snack boxes',
    decor: 'Balloon arches, cartoon character backdrop & LED lighting',
    photography: 'Kids party photographer & instant polaroid print counter',
    entertainment: 'Games anchor, illusionist / magic show, and cartoon mascot',
    misc: 'Return gifts, goodie bags, party hats, and personalized e-invites',
    contingency: 'Safety buffer reserved for last-minute emergency requirements',
  },
  milestone: {
    venue: 'Banquet hall with comfortable ramp and elder seating',
    catering: 'Multi-course sit-down or buffet luncheon with traditional flavors',
    decor: 'Elegant floral stage, nostalgic life memory walkway & photo gallery',
    photography: 'Formal family portraits, candid stills, and anniversary documentary',
    entertainment: 'Acoustic live ghazals, evergreen retro Bollywood, and tribute AV',
    misc: 'Commemorative guest mementos, shawls, and printed invitations',
    contingency: 'Safety buffer reserved for last-minute emergency requirements',
  },
  community: {
    venue: 'Community ground, society clubhouse, or festival pandal',
    catering: 'Community mahaprasad / bhandara mass kitchen service',
    decor: 'Weatherproof tenting, festive floral torans, and festoon lighting',
    photography: 'Event media coverage, press photos, and videography',
    entertainment: 'High-power sound system, devotional bhajan singers & folk dancers',
    misc: 'Municipal police permissions, fire safety clearance, and duty badges',
    contingency: 'Safety buffer reserved for last-minute emergency requirements',
  },
};

/**
 * Calculates effective vendor quote cost based on fixed total or per-plate multiplied by guest count.
 */
export function effectiveQuoteCost(quote: Quote, guestCount: number): number {
  if (quote.totalPrice !== null && quote.totalPrice > 0) {
    return quote.totalPrice;
  }
  if (quote.pricePerPlate !== null && quote.pricePerPlate > 0) {
    const billableGuests = Math.max(guestCount, quote.guestMinimum ?? 0);
    return quote.pricePerPlate * billableGuests;
  }
  return 0;
}

/**
 * Evaluates a vendor quote against category budget and flags potential contractual risks.
 */
export function compareQuoteToBudget(
  quote: Quote,
  categoryBudget: number,
  guestCount: number,
): QuoteComparison {
  const effectiveCost = effectiveQuoteCost(quote, guestCount);
  const variance = effectiveCost - categoryBudget;
  const isOverBudget = variance > 0;
  const flags: QuoteComparison['flags'] = [];

  // Budget variance
  if (isOverBudget) {
    flags.push({
      type: 'warn',
      code: 'OVER_BUDGET',
      message: `Quote is ${formatINR(variance)} (${categoryBudget > 0 ? Math.round((variance / categoryBudget) * 100) : 100}%) above the ${categoryBudget > 0 ? formatINR(categoryBudget) : 'zero'} allocated budget.`,
    });
  } else if (variance < 0 && effectiveCost > 0) {
    flags.push({
      type: 'good',
      code: 'WITHIN_BUDGET',
      message: `Quote is comfortably within budget (leaves ${formatINR(-variance)} buffer).`,
    });
  }

  // Minimum guarantee risk
  if (quote.guestMinimum !== null && quote.guestMinimum > guestCount) {
    flags.push({
      type: 'warn',
      code: 'GUEST_MINIMUM_EXCEEDS',
      message: `Vendor requires a minimum guarantee of ${quote.guestMinimum} guests, but you currently have ${guestCount}. You will be billed for ${quote.guestMinimum} plates.`,
    });
  }

  // Advance payment risk
  if (quote.advancePercent !== null && quote.advancePercent > 50) {
    flags.push({
      type: 'warn',
      code: 'HIGH_ADVANCE',
      message: `Vendor demands ${quote.advancePercent}% advance payment. Standard industry practice is 25%–30% at booking.`,
    });
  }

  // Tax clarity
  if (quote.taxIncluded === null) {
    flags.push({
      type: 'warn',
      code: 'TAX_UNSPECIFIED',
      message:
        'GST/Tax is not specified. Ensure quote is GST-inclusive to avoid unexpected 18% additional bill.',
    });
  } else if (quote.taxIncluded === false) {
    flags.push({
      type: 'info',
      code: 'TAX_EXTRA',
      message: 'Quote explicitly excludes taxes. Budget for +18% GST on final invoice.',
    });
  }

  // Cancellation terms
  if (!quote.cancellationPolicy) {
    flags.push({
      type: 'warn',
      code: 'NO_CANCELLATION_POLICY',
      message:
        'No cancellation or date-change policy stated in quote. Request clear terms in writing.',
    });
  }

  return {
    effectiveCost,
    categoryBudget,
    variance,
    isOverBudget,
    flags,
  };
}

/**
 * Computes payment schedules, advances paid, and upcoming installments across vendor contracts.
 */
export function calculateVendorPayments(vendor: Vendor): PaymentSummary {
  const quoteCost = vendor.quote?.totalPrice ?? 0;
  const milestonesTotal = vendor.payments.reduce((s, p) => s + p.amount, 0);
  const totalAgreed = Math.max(quoteCost, milestonesTotal);

  let totalPaid = 0;
  let nextMilestone: PaymentSummary['nextMilestone'] = null;

  for (const p of vendor.payments) {
    if (p.status === 'paid') {
      totalPaid += p.amount;
    } else if (!nextMilestone) {
      nextMilestone = {
        title: p.title,
        amount: p.amount,
        dueDate: p.dueDate,
      };
    }
  }

  const balanceRemaining = Math.max(0, totalAgreed - totalPaid);
  const paidPercentage = totalAgreed > 0 ? Math.round((totalPaid / totalAgreed) * 100) : 0;

  return {
    totalAgreed,
    totalPaid,
    balanceRemaining,
    paidPercentage,
    nextMilestone,
  };
}

/**
 * Formats a polite, respectful vendor inquiry / negotiation message for WhatsApp.
 */
export function generateVendorInquiry(
  vendorName: string,
  category: Category,
  quote: Quote,
  guestCount: number,
  eventDate: string,
): string {
  const missingPoints: string[] = [];

  if (quote.taxIncluded === null) {
    missingPoints.push(
      'Could you confirm whether the quoted price includes 18% GST or if taxes are extra?',
    );
  }
  if (!quote.cancellationPolicy) {
    missingPoints.push(
      'What are your cancellation and date-rescheduling policies if plans need to adjust?',
    );
  }
  if (quote.advancePercent !== null && quote.advancePercent > 35) {
    missingPoints.push(
      `Regarding the ${quote.advancePercent}% advance, can we structure it as 25% token advance and the remainder on the event week?`,
    );
  }
  if (quote.guestMinimum !== null && quote.guestMinimum > guestCount) {
    missingPoints.push(
      `Our current guest list is ${guestCount}. Is it possible to adjust the ${quote.guestMinimum} minimum plate guarantee?`,
    );
  }

  return `Namaste ${vendorName || 'Ji'}! 🙏\n\nThank you for sharing your proposal for our upcoming celebration on ${eventDate}. We really appreciate your offerings.\n\nWe are reviewing our budget for ${category} and had a few quick questions:\n${missingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nLooking forward to hearing from you so we can finalize our booking soon.\n\nWarm regards,\nHost Family`;
}

/**
 * Derives comprehensive vendor checklist status across all non-contingency categories.
 */
export function vendorChecklist(plan: Plan): VendorChecklistItem[] {
  const bookableCategories = CATEGORIES.filter((c) => c !== 'contingency');
  const labels = OCCASION_LABELS[plan.occasion];
  const hints = VENDOR_CATEGORY_HINTS[plan.occasion];

  return bookableCategories.map((cat) => {
    const matchingVendors = plan.vendors.filter((v) => v.category === cat);
    const matchingQuotes = (plan.quotes ?? []).filter((q) => q.category === cat);
    const hasBooked =
      matchingVendors.some((v) => v.status === 'booked') || matchingQuotes.some((q) => q.accepted);
    const hasQuoted =
      matchingQuotes.length > 0 || matchingVendors.some((v) => v.status === 'quoted' || v.quote);
    const isContacted =
      plan.contacted?.includes(cat) || matchingVendors.some((v) => v.status === 'contacted');

    let status: ChecklistStatus = 'not_started';
    if (hasBooked) status = 'booked';
    else if (hasQuoted) status = 'quoted';
    else if (isContacted) status = 'contacted';

    return {
      category: cat,
      label: labels[cat],
      hint: hints[cat],
      status,
      quotesCount: matchingQuotes.length + matchingVendors.filter((v) => v.quote).length,
      hasAcceptedQuote: hasBooked,
      contacted: isContacted || hasQuoted || hasBooked,
    };
  });
}
