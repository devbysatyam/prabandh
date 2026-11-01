import { IntakeSchema } from '../../schemas';
import { parseINR } from '../../engine/money';
import { clampText, fenceUntrusted, PROMPT_GUARD } from '../../lib/sanitize';
import type { RequestBody } from '../security';
import type { ApiResponse } from '../types';
import { generate, getAiClient, parseJsonRecord } from './gemini';
import { localParseIntake, normalizeDateString } from './localIntake';

const MAX_TEXT_CHARS = 1500;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function buildPrompt(text: string): string {
  return `You parse a free-text event description for an Indian celebration into JSON.
Extract:
- occasion: 'wedding' | 'kids_birthday' | 'milestone' | 'community' (default 'wedding')
- totalBudget: integer rupees (e.g. "50000" -> 50000, "8 lakh" -> 800000, "2 cr" -> 20000000)
- guests: integer headcount
- eventDate: YYYY-MM-DD (convert dates like "15/01/2027" or "15 Jan 2027" to standard YYYY-MM-DD "2027-01-15")
- vibe: short description of style/mood
- city: city/neighborhood name if mentioned (e.g. "New Delhi, Mayur Vihar") or null
- priorities: array of categories emphasized from ['venue', 'catering', 'decor', 'photography', 'entertainment', 'misc']

${PROMPT_GUARD}

User description:
${fenceUntrusted('user_text', text, MAX_TEXT_CHARS)}

Return strict JSON only.`;
}

/** Coerce loosely-typed model output into the shapes IntakeSchema expects. */
function normaliseRaw(raw: Record<string, unknown>, text: string): Record<string, unknown> {
  const out = { ...raw };
  if (typeof out.totalBudget === 'string') out.totalBudget = parseINR(out.totalBudget);
  if (typeof out.guests === 'string') out.guests = parseInt(out.guests, 10);
  if (typeof out.eventDate === 'string' && out.eventDate && !ISO_DATE.test(out.eventDate)) {
    out.eventDate = normalizeDateString(out.eventDate) ?? localParseIntake(text).eventDate;
  }
  return out;
}

/** POST /api/parse-intake: free text -> structured intake (Gemini, with deterministic fallback). */
export async function handleParseIntake(body: RequestBody<'parse-intake'>): Promise<ApiResponse> {
  const text = clampText(body.text, MAX_TEXT_CHARS);
  if (!text) return { status: 400, data: { error: 'Text prompt is required' } };

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await generate(ai, buildPrompt(text), true);
      const parsed = IntakeSchema.safeParse(normaliseRaw(parseJsonRecord(response.text), text));
      if (parsed.success) return { status: 200, data: { ...parsed.data, source: 'gemini' } };
    } catch {
      // Fall through to deterministic local fallback
    }
  }
  return { status: 200, data: { ...localParseIntake(text), source: 'local_deterministic' } };
}
