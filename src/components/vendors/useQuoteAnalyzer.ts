import { useCallback, useState } from 'react';
import type { Category, Quote } from '../../schemas';
import { api } from '../../lib/api';

/** Raw proposal text, AI extraction state and actions for the quote analyzer. */
export function useQuoteAnalyzer(category: Category) {
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Quote | null>(null);

  const analyze = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      setExtracted(await api.extractQuote(rawText, category));
    } catch {
      // Extraction failed: keep the form so the user can retry.
    } finally {
      setIsExtracting(false);
    }
  }, [rawText, category]);

  const clearExtracted = useCallback(() => setExtracted(null), []);
  const reset = useCallback(() => {
    setRawText('');
    setExtracted(null);
  }, []);

  return { rawText, setRawText, isExtracting, extracted, analyze, clearExtracted, reset };
}

export type QuoteAnalyzerState = ReturnType<typeof useQuoteAnalyzer>;
