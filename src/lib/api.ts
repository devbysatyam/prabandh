import type { IdeasResponse, Intake, Plan, PlanReview, Quote } from '../schemas';

const REQUEST_TIMEOUT_MS = 30_000;
const ERROR_CODE = /^[A-Z_]{3,40}$/;

/**
 * POSTs JSON to `/api/<endpoint>` with a 30 s timeout and same-origin credentials.
 *
 * @param endpoint - Endpoint name without the `/api/` prefix.
 * @param data - JSON-serialisable request body.
 * @returns The parsed JSON response. Rejects with a constant machine-readable error code (or `HTTP <status>`), never raw server text.
 * @example
 * ```ts
 * const intake = await postApi<Intake>('parse-intake', { text: '150 guests in Pune' });
 * ```
 */
export async function postApi<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'same-origin',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: unknown };
    // Only surface our constant machine-readable error codes, never arbitrary server text.
    const { error } = errorBody;
    throw new Error(
      typeof error === 'string' && ERROR_CODE.test(error) ? error : `HTTP ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Typed client for the serverless API; every call degrades to local logic at the call site on failure.
 *
 * @example
 * ```ts
 * const { answer } = await api.askCopilot('What is next?', plan, today);
 * ```
 */
export const api = {
  parseIntake: (text: string) => postApi<Intake>('parse-intake', { text }),
  extractQuote: (text: string, category: string) =>
    postApi<Quote>('extract-quote', { text, category }),
  askCopilot: (question: string, plan: Plan, today?: string) =>
    postApi<{ answer: string; source: string }>('ask-copilot', { question, plan, today }),
  suggestIdeas: (occasion: string, vibe: string, guests: number, totalBudget: number) =>
    postApi<IdeasResponse>('suggest-ideas', { occasion, vibe, guests, totalBudget }),
  reviewPlan: (plan: Plan, today?: string) => postApi<PlanReview>('review-plan', { plan, today }),
};
