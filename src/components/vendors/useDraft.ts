import { useCallback, useState } from 'react';

/** Form draft state: a single object plus a partial-patch updater. */
export function useDraft<T extends object>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const patch = useCallback((changes: Partial<T>) => setDraft((d) => ({ ...d, ...changes })), []);
  return [draft, patch] as const;
}
