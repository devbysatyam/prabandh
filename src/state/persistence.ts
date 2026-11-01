import { PlanSchema, type Plan } from '../schemas';

/** localStorage key under which the current plan is autosaved. */
export const STORAGE_KEY = 'prabandh_plan_v1';

/** Cap on the size of an untrusted share-link hash. */
const MAX_SHARE_HASH_CHARS = 400_000;
const SHARE_HASH_PREFIX = 'plan=';

function parsePlan(json: string): Plan | null {
  const valid = PlanSchema.safeParse(JSON.parse(json));
  return valid.success ? valid.data : null;
}

function planFromShareHash(): Plan | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return null;
  if (hash.length > MAX_SHARE_HASH_CHARS) return null;
  return parsePlan(atob(decodeURIComponent(hash.slice(SHARE_HASH_PREFIX.length))));
}

function planFromStorage(): Plan | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parsePlan(raw) : null;
}

/** Run a loader, treating any failure (corrupt data, blocked storage) as "no plan". */
function attempt(load: () => Plan | null): Plan | null {
  try {
    return load();
  } catch {
    return null;
  }
}

/**
 * Loads the plan from a share-link URL hash, falling back to localStorage.
 *
 * @returns The validated plan, or `null` when nothing valid is stored.
 * @example
 * ```ts
 * const plan = getInitialPlan(); // => Plan | null
 * ```
 */
export function getInitialPlan(): Plan | null {
  if (typeof window === 'undefined') return null;
  return attempt(planFromShareHash) ?? attempt(planFromStorage);
}

/**
 * Persists the plan to localStorage; silently ignores quota / unavailable-storage errors.
 *
 * @param plan - Plan to save.
 * @example
 * ```ts
 * savePlan(plan);
 * ```
 */
export function savePlan(plan: Plan): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Storage quota full or unavailable
  }
}

/**
 * Removes the persisted plan; silently ignores unavailable storage.
 *
 * @example
 * ```ts
 * clearSavedPlan();
 * ```
 */
export function clearSavedPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Encodes the plan into a base64 share link (`#share=...`) on the current page.
 *
 * @param plan - Plan to share.
 * @returns Absolute URL, or the current location when encoding fails.
 * @example
 * ```ts
 * encodePlanShareLink(plan); // => 'https://app.example/#plan=eyJ0aXRsZSI6...'
 * ```
 */
export function encodePlanShareLink(plan: Plan): string {
  try {
    const b64 = btoa(JSON.stringify(plan));
    return `${window.location.origin}${window.location.pathname}#${SHARE_HASH_PREFIX}${encodeURIComponent(b64)}`;
  } catch {
    return window.location.href;
  }
}
