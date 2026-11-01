import type { FC } from 'react';

const DEVANAGARI_RUN = /([ऀ-ॿ]+(?:[ ‌‍]+[ऀ-ॿ]+)*)/;

/**
 * Renders a bilingual string, marking Devanagari runs with lang="hi"
 * so screen readers pronounce them with a Hindi voice (WCAG 3.1.2).
 */
export const LangText: FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(DEVANAGARI_RUN).map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} lang="hi">
          {part}
        </span>
      ) : (
        part
      ),
    )}
  </>
);
