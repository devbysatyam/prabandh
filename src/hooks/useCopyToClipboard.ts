import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the "Copied!" confirmation stays visible. */
export const COPIED_FEEDBACK_MS = 2500;

/**
 * Copy text to the clipboard and expose a transient `copied` flag (the copied key, or null).
 * Failures (blocked clipboard) are swallowed so the UI never throws.
 */
export function useCopyToClipboard(): {
  copiedKey: string | null;
  copy: (text: string, key?: string) => void;
} {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback((text: string, key = 'default') => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedKey(key);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopiedKey(null), COPIED_FEEDBACK_MS);
      })
      .catch(() => undefined);
  }, []);

  return { copiedKey, copy };
}
