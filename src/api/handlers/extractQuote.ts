import { QuoteSchema, type Quote } from '../../schemas';
import { parseINR } from '../../engine/money';
import { clampText, fenceUntrusted, PROMPT_GUARD } from '../../lib/sanitize';
import type { RequestBody } from '../security';
import type { ApiResponse } from '../types';
import { generate, getAiClient, parseJsonRecord } from './gemini';

const MAX_TEXT_CHARS = 3000;
const VENDOR_NAME_MAX_CHARS = 40;

function buildPrompt(text: string, category: string): string {
  return `You extract structured pricing and contract terms from a vendor quote in India.
Text may be from WhatsApp or email.
Category: ${category.replace(/[^a-z_]/g, '')}

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

${PROMPT_GUARD}

Quote text:
${fenceUntrusted('user_text', text, MAX_TEXT_CHARS)}

Return strict JSON only. Never invent prices. If not stated, use null.`;
}

/** Return the first capture group of `re` in `text`, or undefined. */
function firstGroup(re: RegExp, text: string): string | undefined {
  return re.exec(text)?.[1];
}

function detectTaxIncluded(lower: string): boolean | null {
  if (lower.includes('gst included') || lower.includes('taxes inclusive')) return true;
  if (lower.includes('+ 18% gst') || lower.includes('gst extra') || lower.includes('+ gst')) {
    return false;
  }
  return null;
}

function intOrNull(raw: string | undefined): number | null {
  return raw ? parseInt(raw, 10) : null;
}

/** Deterministic regex extractor used when Gemini is unavailable or returns invalid output. */
export function localExtractQuote(text: string, category: Quote['category']): Quote {
  const plate = firstGroup(
    /(?:₹|rs\.?)?\s*(\d[\d,.]*)\s*(?:per\s*plate|\/plate|\/person|per\s*head)/i,
    text,
  );
  const total = firstGroup(
    /(?:total|package|all\s*inclusive|grand\s*total)\D*(\d[\d,.]*\s*(?:lakh|l|cr|k)?)/i,
    text,
  );
  const taxIncluded = detectTaxIncluded(text.toLowerCase());

  return {
    vendorName: text.split('\n')[0]?.slice(0, VENDOR_NAME_MAX_CHARS) ?? 'Vendor',
    category,
    totalPrice: total ? parseINR(total) : null,
    pricePerPlate: plate ? parseINR(plate) : null,
    guestMinimum: intOrNull(firstGroup(/minimum\s*(\d+)\s*(?:pax|plates|guests)/i, text)),
    overtimeFeePerHour: null,
    taxIncluded,
    advancePercent: intOrNull(firstGroup(/(\d+)\s*%\s*advance/i, text)),
    inclusions: ['Standard services as described in message'],
    exclusions: taxIncluded === false ? ['18% GST extra'] : [],
    cancellationPolicy: null,
  };
}

/** POST /api/extract-quote: vendor quote text -> structured quote (Gemini, with local fallback). */
export async function handleExtractQuote(body: RequestBody<'extract-quote'>): Promise<ApiResponse> {
  const text = clampText(body.text, MAX_TEXT_CHARS);
  const category = body.category;
  if (!text) return { status: 400, data: { error: 'Quote text is required' } };

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await generate(ai, buildPrompt(text, category), true);
      const parsed = QuoteSchema.safeParse({ ...parseJsonRecord(response.text), category });
      if (parsed.success) return { status: 200, data: parsed.data };
    } catch {
      // Fall through to deterministic extractor
    }
  }
  return { status: 200, data: localExtractQuote(text, category) };
}
