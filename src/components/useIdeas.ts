import { useCallback, useEffect, useState } from 'react';
import type { IdeasResponse, Plan } from '../schemas';
import { api } from '../lib/api';

interface IdeasResult {
  key: string;
  ideas: IdeasResponse | null;
}

/**
 * Fetches themed ideas for the plan, refetching when the occasion, vibe, guests or budget change
 * (or when `regenerate` is called). `loading` is derived, so no state is set synchronously in the effect.
 */
export function useIdeas(plan: Pick<Plan, 'occasion' | 'vibe' | 'guests' | 'totalBudget'>): {
  ideas: IdeasResponse | null;
  loading: boolean;
  regenerate: () => void;
} {
  const { occasion, vibe, guests, totalBudget } = plan;
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<IdeasResult | null>(null);
  const key = `${occasion}|${vibe}|${guests}|${totalBudget}|${nonce}`;

  useEffect(() => {
    let cancelled = false;
    api
      .suggestIdeas(occasion, vibe, guests, totalBudget)
      .catch(() => null) // the server already falls back to curated defaults
      .then((fetched) => {
        if (!cancelled) {
          setResult((prev) => ({ key, ideas: fetched ?? prev?.ideas ?? null }));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, occasion, vibe, guests, totalBudget]);

  const regenerate = useCallback(() => setNonce((n) => n + 1), []);
  return { ideas: result?.ideas ?? null, loading: result?.key !== key, regenerate };
}
