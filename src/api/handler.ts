import { GoogleGenAI } from '@google/genai';
import {
  IdeasResponseSchema,
  IntakeSchema,
  PlanReviewSchema,
  QuoteSchema,
  type Intake,
  type Plan,
  type Quote,
} from '../schemas';
import { localAnswer, planFacts, planInsights } from '../engine/advisor';
import { parseINR } from '../engine/money';

export interface ApiResponse<T = any> {
  status: number;
  data: T;
}

const API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LIufQvKwMF095_XCTc99rv8tcAf29WmNIxgGY73Vw5oA';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

function getAiClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  try {
    return new GoogleGenAI({ apiKey: API_KEY });
  } catch {
    return null;
  }
}

/**
 * Universal backend handler for both Vite dev server and serverless deployments.
 */
export async function handleApiRequest(
  route: string,
  body: any,
  _method: string,
): Promise<ApiResponse> {
  try {
    switch (route) {
      case 'parse-intake':
        return await handleParseIntake(body);
      case 'extract-quote':
        return await handleExtractQuote(body);
      case 'ask-copilot':
        return await handleAskCopilot(body);
      case 'suggest-ideas':
        return await handleSuggestIdeas(body);
      case 'review-plan':
        return await handleReviewPlan(body);
      default:
        return { status: 404, data: { error: 'ENDPOINT_NOT_FOUND' } };
    }
  } catch (err: any) {
    return { status: 500, data: { error: err?.message || 'INTERNAL_ERROR' } };
  }
}

function normalizeDateString(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = /^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})$/.exec(s);
  if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD
  const ymdMatch = /^(\d{4})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})$/.exec(s);
  if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

function extractDateFromText(text: string): string {
  // 1. Look for DD/MM/YYYY or DD-MM-YYYY (e.g. "on 15 /01/2027", "15/01/2027", "15-01-2027")
  const dmy = /(?:on\s+)?(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})/i.exec(text);
  if (dmy && dmy[1] && dmy[2] && dmy[3]) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Look for textual month e.g. "15th Jan 2027", "15 January 2027"
  const textMonth = /(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})/i.exec(text);
  if (textMonth && textMonth[1] && textMonth[2] && textMonth[3]) {
    const day = textMonth[1].padStart(2, '0');
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthPart = textMonth[2].toLowerCase();
    const mIdx = months.findIndex((m) => monthPart.startsWith(m));
    if (mIdx >= 0) {
      const month = String(mIdx + 1).padStart(2, '0');
      const year = textMonth[3];
      return `${year}-${month}-${day}`;
    }
  }

  // 3. Look for standard YYYY-MM-DD
  const ymd = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (ymd) {
    return ymd[0];
  }

  // Default to 4 months in future
  const future = new Date();
  future.setMonth(future.getMonth() + 4);
  return future.toISOString().slice(0, 10);
}

function extractBudgetFromText(text: string, occasion: Intake['occasion']): number {
  // 1. Explicit budget phrase: "budget is 50000", "budget: 50,000", "cost around 15 lakh"
  const explicit = /(?:budget|cost|total|amount|kharcha)\s*(?:is|of|around|approx|approx\.|:|=)?\s*([₹\d,.]+\s*(?:lakhs?|lacs?|l\b|crores?|cr\b|k\b|thousands?)?)/i.exec(text);
  if (explicit && explicit[1]) {
    const p = parseINR(explicit[1]);
    if (p && p >= 1000) return p;
  }

  // 2. Unit match with strict word boundary (e.g. "15 lakh", "50k", "2 cr", ensuring "2027 kids" does NOT match "2027 k")
  const unitMatch = /([0-9.]+)\s*(?:lakhs?|lacs?|l\b|crores?|cr\b|k\b|thousands?)/i.exec(text);
  if (unitMatch) {
    const found = parseINR(unitMatch[0]);
    if (found && found >= 1000) return found;
  }

  // 3. Rupee symbol: "₹50,000" or "Rs. 75000"
  const inrSymbol = /(?:₹|rs\.?)\s*([\d,.]+)/i.exec(text);
  if (inrSymbol && inrSymbol[1]) {
    const found = parseINR(inrSymbol[1]);
    if (found && found >= 1000) return found;
  }

  // Fallback defaults by occasion
  if (occasion === 'kids_birthday') return 60000;
  if (occasion === 'community') return 300000;
  if (occasion === 'milestone') return 500000;
  return 1500000;
}

function extractGuestsFromText(text: string): number {
  const lower = text.toLowerCase();
  // Handles "150 guest", "150 guests", "200 pax", "80 people", "100 mehmaan", "50 kids"
  const guestMatch = /(?:around|approx|approx\.)?\s*(\d+)\s*(?:guests?|people|pax|persons?|log|mehmaan|kids?|children|attendees?)\b/i.exec(lower);
  if (guestMatch && guestMatch[1]) {
    const num = parseInt(guestMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  const generalNumber = /(\d+)\s*(?:headcount|seats|plates)/i.exec(lower);
  if (generalNumber && generalNumber[1]) {
    const num = parseInt(generalNumber[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 150;
}

function extractOccasionFromText(text: string): Intake['occasion'] {
  const lower = text.toLowerCase();
  if (
    lower.includes('birthday') ||
    lower.includes('bday') ||
    lower.includes('kids party') ||
    lower.includes('kid') ||
    lower.includes('child') ||
    lower.includes('turning')
  ) {
    return 'kids_birthday';
  }
  if (
    lower.includes('milestone') ||
    lower.includes('anniversary') ||
    lower.includes('50th') ||
    lower.includes('60th') ||
    lower.includes('jubilee') ||
    lower.includes('retirement')
  ) {
    return 'milestone';
  }
  if (
    lower.includes('community') ||
    lower.includes('festival') ||
    lower.includes('diwali') ||
    lower.includes('puja') ||
    lower.includes('pooja') ||
    lower.includes('ganesh') ||
    lower.includes('navratri') ||
    lower.includes('society')
  ) {
    return 'community';
  }
  return 'wedding';
}

function extractCityFromText(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Neighborhood and City composite matches
  if (lower.includes('mayur vihar') && lower.includes('delhi')) return 'New Delhi (Mayur Vihar)';
  if (lower.includes('dwarka') && lower.includes('delhi')) return 'New Delhi (Dwarka)';
  if (lower.includes('rohini') && lower.includes('delhi')) return 'New Delhi (Rohini)';
  if (lower.includes('south delhi')) return 'South Delhi';
  if (lower.includes('new delhi')) return 'New Delhi';
  if (lower.includes('delhi')) return 'Delhi';
  if (lower.includes('noida')) return 'Noida';
  if (lower.includes('gurgaon') || lower.includes('gurugram')) return 'Gurugram';
  if (lower.includes('kothrud') && lower.includes('pune')) return 'Pune (Kothrud)';
  if (lower.includes('baner') && lower.includes('pune')) return 'Pune (Baner)';
  if (lower.includes('pune')) return 'Pune';
  if (lower.includes('bandra') && lower.includes('mumbai')) return 'Mumbai (Bandra)';
  if (lower.includes('juhu') && lower.includes('mumbai')) return 'Mumbai (Juhu)';
  if (lower.includes('mumbai')) return 'Mumbai';
  if (lower.includes('bangalore') || lower.includes('bengaluru')) return 'Bengaluru';
  if (lower.includes('hyderabad')) return 'Hyderabad';
  if (lower.includes('jaipur')) return 'Jaipur';
  if (lower.includes('udaipur')) return 'Udaipur';
  if (lower.includes('ahmedabad')) return 'Ahmedabad';
  if (lower.includes('chandigarh')) return 'Chandigarh';
  if (lower.includes('lucknow')) return 'Lucknow';
  if (lower.includes('goa')) return 'Goa';
  if (lower.includes('kolkata')) return 'Kolkata';
  if (lower.includes('chennai')) return 'Chennai';

  return undefined;
}

function extractPrioritiesFromText(text: string, occasion: Intake['occasion']): Intake['priorities'] {
  const lower = text.toLowerCase();
  const priorities: Intake['priorities'] = [];

  if (
    lower.includes('decor') ||
    lower.includes('theme') ||
    lower.includes('flower') ||
    lower.includes('balloon') ||
    lower.includes('mandap')
  ) {
    priorities.push('decor');
  }

  if (
    lower.includes('dj') ||
    lower.includes('music') ||
    lower.includes('dance') ||
    lower.includes('sangeet') ||
    lower.includes('game') ||
    lower.includes('magic') ||
    lower.includes('entertain') ||
    lower.includes('party')
  ) {
    priorities.push('entertainment');
  }

  if (
    lower.includes('food') ||
    lower.includes('cater') ||
    lower.includes('menu') ||
    lower.includes('snack') ||
    lower.includes('cake') ||
    lower.includes('chaat') ||
    lower.includes('feast')
  ) {
    priorities.push('catering');
  }

  if (
    lower.includes('photo') ||
    lower.includes('shoot') ||
    lower.includes('film') ||
    lower.includes('candid') ||
    lower.includes('cinemat')
  ) {
    priorities.push('photography');
  }

  if (
    lower.includes('venue') ||
    lower.includes('lawn') ||
    lower.includes('hall') ||
    lower.includes('resort') ||
    lower.includes('banquet') ||
    lower.includes('play zone')
  ) {
    priorities.push('venue');
  }

  if (priorities.length === 0) {
    if (occasion === 'kids_birthday') return ['decor', 'entertainment', 'catering'];
    if (occasion === 'milestone') return ['catering', 'photography', 'entertainment'];
    if (occasion === 'community') return ['catering', 'venue', 'entertainment'];
    return ['catering', 'venue', 'photography'];
  }

  return priorities;
}

/* 1. Parse Intake */
async function handleParseIntake(body: { text?: string }): Promise<ApiResponse> {
  const text = (body?.text ?? '').slice(0, 1500).trim();
  if (!text) {
    return { status: 400, data: { error: 'Text prompt is required' } };
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You parse a free-text event description for an Indian celebration into JSON.
Extract:
- occasion: 'wedding' | 'kids_birthday' | 'milestone' | 'community' (default 'wedding')
- totalBudget: integer rupees (e.g. "50000" -> 50000, "8 lakh" -> 800000, "2 cr" -> 20000000)
- guests: integer headcount
- eventDate: YYYY-MM-DD (convert dates like "15/01/2027" or "15 Jan 2027" to standard YYYY-MM-DD "2027-01-15")
- vibe: short description of style/mood
- city: city/neighborhood name if mentioned (e.g. "New Delhi, Mayur Vihar") or null
- priorities: array of categories emphasized from ['venue', 'catering', 'decor', 'photography', 'entertainment', 'misc']

User description:
<user_text>
${text}
</user_text>

Return strict JSON only.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = JSON.parse(response.text ?? '{}');

      // Normalize fields for robust schema parsing
      if (typeof raw.totalBudget === 'string') {
        raw.totalBudget = parseINR(raw.totalBudget);
      }
      if (typeof raw.guests === 'string') {
        raw.guests = parseInt(raw.guests, 10);
      }
      if (raw.eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(raw.eventDate)) {
        raw.eventDate = normalizeDateString(raw.eventDate) ?? extractDateFromText(text);
      }

      const parsed = IntakeSchema.safeParse(raw);
      if (parsed.success) {
        return { status: 200, data: { ...parsed.data, source: 'gemini' } };
      }
    } catch {
      // Fall through to deterministic local fallback
    }
  }

  // Local deterministic fallback parser
  return { status: 200, data: { ...localParseIntake(text), source: 'local_deterministic' } };
}

function localParseIntake(text: string): Intake {
  const occasion = extractOccasionFromText(text);
  const totalBudget = extractBudgetFromText(text, occasion);
  const guests = extractGuestsFromText(text);
  const eventDate = extractDateFromText(text);
  const city = extractCityFromText(text);
  const priorities = extractPrioritiesFromText(text, occasion);

  return {
    occasion,
    totalBudget,
    guests,
    eventDate,
    vibe: text.slice(0, 150).trim(),
    city,
    priorities,
  };
}

/* 2. Extract Quote */
async function handleExtractQuote(body: { text?: string; category?: string }): Promise<ApiResponse> {
  const text = (body?.text ?? '').slice(0, 3000).trim();
  const category = (body?.category ?? 'catering') as any;

  if (!text) {
    return { status: 400, data: { error: 'Quote text is required' } };
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You extract structured pricing and contract terms from a vendor quote in India.
Text may be from WhatsApp or email.
Category: ${category}

Extract:
- vendorName: string or null
- totalPrice: integer rupees or null
- pricePerPlate: integer rupees or null
- guestMinimum: integer or null
- overtimeFeePerHour: integer rupees or null
- taxIncluded: boolean (true if GST included, false if GST extra, null if not mentioned)
- advancePercent: number (0-100) or null
- inclusions: array of strings
- exclusions: array of strings
- cancellationPolicy: string or null

Quote text:
<user_text>
${text}
</user_text>

Return strict JSON only. Never invent prices. If not stated, use null.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const raw = JSON.parse(response.text ?? '{}');
      const parsed = QuoteSchema.safeParse({ ...raw, category });
      if (parsed.success) {
        return { status: 200, data: parsed.data };
      }
    } catch {
      // Fall through to deterministic extractor
    }
  }

  return { status: 200, data: localExtractQuote(text, category) };
}

function localExtractQuote(text: string, category: any): Quote {
  const lower = text.toLowerCase();

  // Price per plate e.g. "1500 per plate" or "₹1,200/plate"
  let pricePerPlate: number | null = null;
  const plateMatch = /(?:₹|rs\.?)?\s*(\d[\d,.]*)\s*(?:per\s*plate|\/plate|\/person|per\s*head)/i.exec(text);
  if (plateMatch && plateMatch[1]) {
    pricePerPlate = parseINR(plateMatch[1]);
  }

  // Total price e.g. "total 2.5 lakh" or "₹3,50,000 for package"
  let totalPrice: number | null = null;
  const totalMatch = /(?:total|package|all\s*inclusive|grand\s*total)\D*(\d[\d,.]*\s*(?:lakh|l|cr|k)?)/i.exec(text);
  if (totalMatch && totalMatch[1]) {
    totalPrice = parseINR(totalMatch[1]);
  }

  // Advance percent
  let advancePercent: number | null = null;
  const advMatch = /(\d+)\s*%\s*advance/i.exec(text);
  if (advMatch && advMatch[1]) {
    advancePercent = parseInt(advMatch[1], 10);
  }

  // Minimum guests
  let guestMinimum: number | null = null;
  const minMatch = /minimum\s*(\d+)\s*(?:pax|plates|guests)/i.exec(text);
  if (minMatch && minMatch[1]) {
    guestMinimum = parseInt(minMatch[1], 10);
  }

  const taxIncluded = lower.includes('gst included') || lower.includes('taxes inclusive')
    ? true
    : lower.includes('+ 18% gst') || lower.includes('gst extra') || lower.includes('+ gst')
    ? false
    : null;

  return {
    vendorName: text.split('\n')[0]?.slice(0, 40) ?? 'Vendor',
    category,
    totalPrice,
    pricePerPlate,
    guestMinimum,
    overtimeFeePerHour: null,
    taxIncluded,
    advancePercent,
    inclusions: ['Standard services as described in message'],
    exclusions: taxIncluded === false ? ['18% GST extra'] : [],
    cancellationPolicy: null,
  };
}

/* 3. Ask Copilot */
async function handleAskCopilot(body: { question?: string; plan?: Plan; today?: string }): Promise<ApiResponse> {
  const question = (body?.question ?? '').slice(0, 500).trim();
  const plan = body?.plan;
  const today = body?.today ?? new Date().toISOString().slice(0, 10);

  if (!question || !plan) {
    return { status: 400, data: { error: 'Question and plan are required' } };
  }

  const facts = planFacts(plan, today);
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are Prabandh's (प्रबंध) AI planning copilot: a warm, expert Indian celebration planner chatting with a family.
Ground every answer strictly in the facts provided below. Never invent vendor rates or prices.

Plan Facts:
${facts}

User Question:
<user_text>
${question}
</user_text>

Answer directly, warmly, and concisely (under 120 words) in English or Hinglish. Quote exact figures from the facts.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      return {
        status: 200,
        data: {
          answer: response.text?.trim() ?? localAnswer(question, plan, today),
          source: 'gemini',
        },
      };
    } catch {
      // Fall through to deterministic local planner
    }
  }

  return {
    status: 200,
    data: {
      answer: localAnswer(question, plan, today),
      source: 'local_deterministic',
    },
  };
}

/* 4. Suggest Ideas */
async function handleSuggestIdeas(body: {
  occasion?: string;
  vibe?: string;
  guests?: number;
  totalBudget?: number;
}): Promise<ApiResponse> {
  const occasion = body?.occasion ?? 'wedding';
  const vibe = body?.vibe ?? 'Joyful Indian family celebration';
  const guests = body?.guests ?? 150;

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Suggest culturally authentic, bespoke ideas for an Indian ${occasion} celebration.
Vibe: ${vibe}
Guests: ${guests}

Provide JSON with:
- themes: array of { title, description } (3-4 items)
- activities: array of strings (4-5 ideas)
- foodStyle: array of strings (menu & live counter recommendations)
- personalTouches: array of strings (meaningful family details)
- invitationLine: warm, inviting 1-2 sentence invitation text`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const raw = JSON.parse(response.text ?? '{}');
      const parsed = IdeasResponseSchema.safeParse(raw);
      if (parsed.success) {
        return { status: 200, data: parsed.data };
      }
    } catch {
      // Fall through to presets
    }
  }

  // High quality default suggestions
  return {
    status: 200,
    data: {
      themes: [
        {
          title: 'Royal Marigold & Brass Elegance',
          description: 'Timeless traditional celebration with scented genda phool cascades, antique brass urlis, and warm fairy lights.',
        },
        {
          title: 'Modern Pastel Garden Fairytale',
          description: 'Soft blush pinks, sage greens, and delicate floral canopies ideal for open-air afternoon and sunset gatherings.',
        },
        {
          title: 'Vibrant Sangeet Carnivale',
          description: 'High energy colourful drapery, neon sign photo-booths, interactive dhol entry, and fusion street-food stalls.',
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
    },
  };
}

/* 5. Review Plan */
async function handleReviewPlan(body: { plan?: Plan; today?: string }): Promise<ApiResponse> {
  const plan = body?.plan;
  const today = body?.today ?? new Date().toISOString().slice(0, 10);

  if (!plan) {
    return { status: 400, data: { error: 'Plan is required' } };
  }

  const insights = planInsights(plan, today);
  const critical = insights.filter((i) => i.severity === 'critical');
  const warnings = insights.filter((i) => i.severity === 'warning');

  let healthScore = 100;
  healthScore -= critical.length * 20;
  healthScore -= warnings.length * 8;
  healthScore = Math.max(15, Math.min(100, healthScore));

  const review: any = {
    summary:
      critical.length > 0
        ? `Your plan requires immediate attention on ${critical.length} critical items (budget & deadlines). Addressing these now will keep your event stress-free.`
        : `Your celebration plan is in good shape with a health score of ${healthScore}%. Follow up on pending vendor milestones to stay ahead.`,
    healthScore,
    topRisks: insights.slice(0, 3).map((i) => `${i.title}: ${i.detail}`),
    recommendedActions: insights.slice(0, 3).map((i) => ({
      title: i.title,
      description: i.detail,
      impact: i.severity === 'critical' ? 'high' : 'medium',
    })),
  };

  const parsed = PlanReviewSchema.safeParse(review);
  return { status: 200, data: parsed.success ? parsed.data : review };
}
