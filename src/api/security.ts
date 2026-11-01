/**
 * Request-level protections shared by serverless functions and the dev middleware.
 * Maps to OWASP API Top 10 2023: API2 (auth/abuse), API4 (resource consumption),
 * API8 (misconfiguration), API10 (unsafe consumption of upstream/LLM output).
 */
import { z } from 'zod';
import { CategorySchema, OccasionSchema, PlanSchema, MAX_BUDGET, MAX_GUESTS } from '../schemas';
import { stripControlChars } from '../lib/sanitize';

export const MAX_BODY_BYTES = 256 * 1024; // plan payloads are well under this
export const AI_TIMEOUT_MS = 20_000;
export const ROUTES = [
  'parse-intake',
  'extract-quote',
  'ask-copilot',
  'suggest-ideas',
  'review-plan',
] as const;
export type Route = (typeof ROUTES)[number];

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// Hard ceiling at 4x; handlers clamp to the real limit after control-char stripping.
const text = (max: number) =>
  z
    .string()
    .max(max * 4)
    .transform((s) => stripControlChars(s));

export const RequestSchemas = {
  'parse-intake': z.object({ text: text(1500) }),
  'extract-quote': z.object({ text: text(3000), category: CategorySchema.default('catering') }),
  'ask-copilot': z.object({ question: text(500), plan: PlanSchema, today: dateStr.optional() }),
  'suggest-ideas': z.object({
    occasion: OccasionSchema.default('wedding'),
    vibe: text(300).default('Joyful Indian family celebration'),
    guests: z.number().int().min(1).max(MAX_GUESTS).default(150),
    totalBudget: z.number().int().min(0).max(MAX_BUDGET).optional(),
  }),
  'review-plan': z.object({ plan: PlanSchema, today: dateStr.optional() }),
} as const;

/** Validated (post-Zod) request body for a given route. */
export type RequestBody<R extends Route> = z.output<(typeof RequestSchemas)[R]>;

/** Constant-shape error bodies: never leak messages, stacks or internals. */
export const ERRORS = {
  badRequest: { status: 400, data: { error: 'INVALID_REQUEST' } },
  tooLarge: { status: 413, data: { error: 'PAYLOAD_TOO_LARGE' } },
  unsupported: { status: 415, data: { error: 'UNSUPPORTED_MEDIA_TYPE' } },
  method: { status: 405, data: { error: 'METHOD_NOT_ALLOWED' } },
  forbidden: { status: 403, data: { error: 'FORBIDDEN_ORIGIN' } },
  rate: { status: 429, data: { error: 'RATE_LIMITED' } },
  notFound: { status: 404, data: { error: 'ENDPOINT_NOT_FOUND' } },
  internal: { status: 500, data: { error: 'INTERNAL_ERROR' } },
} as const;

/* ---------- Fixed-window in-memory rate limiter (best effort per warm instance) ---------- */
const WINDOW_MS = 60_000;
const MAX_REQ = 30;
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, now = Date.now(), limit = MAX_REQ): boolean {
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    if (buckets.size > 5000) buckets.clear();
  }
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function resetRateLimit(): void {
  buckets.clear();
}

/** Same-origin check (CSRF / cross-site API abuse): reject when Origin host differs from Host. */
export function isAllowedOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true; // non-browser clients / same-origin requests without Origin
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function isJsonContentType(ct: string | undefined): boolean {
  return !!ct && /^application\/json\s*(;|$)/i.test(ct);
}

/** Race a promise against a timeout so upstream stalls cannot exhaust the function. */
export function withTimeout<T>(p: Promise<T>, ms = AI_TIMEOUT_MS): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error('UPSTREAM_TIMEOUT')), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

/** Log only a short error class, never request content, keys or stacks. */
export function safeLog(scope: string, err: unknown): void {
  const name = err instanceof Error ? err.name : 'UnknownError';
  console.error(`[${scope}] ${name}`);
}
