import { IdeasResponseSchema } from '../../schemas';
import { clampText, fenceUntrusted, PROMPT_GUARD } from '../../lib/sanitize';
import type { RequestBody } from '../security';
import type { ApiResponse } from '../types';
import { generate, getAiClient, parseJsonRecord } from './gemini';
import { DEFAULT_IDEAS } from './ideasDefaults';

const MAX_VIBE_CHARS = 300;

function buildPrompt(occasion: string, vibe: string, guests: number): string {
  return `Suggest culturally authentic, bespoke ideas for an Indian ${occasion} celebration.
${PROMPT_GUARD}
Vibe:
${fenceUntrusted('user_text', vibe, MAX_VIBE_CHARS)}
Guests: ${guests}

Provide JSON with:
- themes: array of { title, description } (3-4 items)
- activities: array of strings (4-5 ideas)
- foodStyle: array of strings (menu & live counter recommendations)
- personalTouches: array of strings (meaningful family details)
- invitationLine: warm, inviting 1-2 sentence invitation text`;
}

/** POST /api/suggest-ideas: themed ideas for the occasion (Gemini, with curated defaults). */
export async function handleSuggestIdeas(body: RequestBody<'suggest-ideas'>): Promise<ApiResponse> {
  const vibe = clampText(body.vibe, MAX_VIBE_CHARS) || 'Joyful Indian family celebration';

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await generate(ai, buildPrompt(body.occasion, vibe, body.guests), true);
      const parsed = IdeasResponseSchema.safeParse(parseJsonRecord(response.text));
      if (parsed.success) return { status: 200, data: parsed.data };
    } catch {
      // Fall through to presets
    }
  }
  return { status: 200, data: DEFAULT_IDEAS };
}
