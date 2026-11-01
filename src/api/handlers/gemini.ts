import { getAiClient, MODEL_NAME } from '../../../api/_lib/gemini';
import { withTimeout } from '../security';

/** Gemini output token ceilings. */
const JSON_MAX_OUTPUT_TOKENS = 2048;
const TEXT_MAX_OUTPUT_TOKENS = 512;

export type AiClient = NonNullable<ReturnType<typeof getAiClient>>;

export { getAiClient };

/** Call Gemini with a hard timeout. Output is always re-validated by a Zod schema by callers. */
export function generate(ai: AiClient, contents: string, json: boolean) {
  return withTimeout(
    ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: json
        ? { responseMimeType: 'application/json', maxOutputTokens: JSON_MAX_OUTPUT_TOKENS }
        : { maxOutputTokens: TEXT_MAX_OUTPUT_TOKENS },
    }),
  );
}

/** Parse the JSON text of a Gemini response into an untyped record (validated later by Zod). */
export function parseJsonRecord(text: string | undefined): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text ?? '{}');
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}
