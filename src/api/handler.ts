import { ERRORS, RequestSchemas, safeLog, type RequestBody, type Route } from './security';
import type { ApiResponse } from './types';
import { handleAskCopilot } from './handlers/askCopilot';
import { handleExtractQuote } from './handlers/extractQuote';
import { handleParseIntake } from './handlers/parseIntake';
import { handleReviewPlan } from './handlers/reviewPlan';
import { handleSuggestIdeas } from './handlers/suggestIdeas';

export type { ApiResponse } from './types';

const ROUTE_HANDLERS: { [R in Route]: (body: RequestBody<R>) => Promise<ApiResponse> } = {
  'parse-intake': handleParseIntake,
  'extract-quote': handleExtractQuote,
  'ask-copilot': handleAskCopilot,
  'suggest-ideas': handleSuggestIdeas,
  'review-plan': handleReviewPlan,
};

function isRoute(route: string): route is Route {
  return Object.prototype.hasOwnProperty.call(RequestSchemas, route);
}

async function dispatch<R extends Route>(route: R, body: unknown): Promise<ApiResponse> {
  const checked = RequestSchemas[route].safeParse(body ?? {});
  if (!checked.success) return { ...ERRORS.badRequest };
  return ROUTE_HANDLERS[route](checked.data as RequestBody<R>);
}

/**
 * Universal backend handler for both Vite dev server and serverless deployments.
 * Validates every request body with Zod before any business logic runs.
 */
export async function handleApiRequest(
  route: string,
  body: unknown,
  method = 'POST',
): Promise<ApiResponse> {
  if (method !== 'POST') return { ...ERRORS.method };
  if (!isRoute(route)) return { ...ERRORS.notFound };
  try {
    return await dispatch(route, body);
  } catch (err) {
    safeLog(`api/${route}`, err);
    return { ...ERRORS.internal };
  }
}
