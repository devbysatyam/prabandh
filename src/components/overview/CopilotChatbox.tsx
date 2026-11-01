import { memo, useState, type FC, type FormEvent } from 'react';
import { Icon } from '../Icon';
import { LangText } from '../LangText';
import { SUGGESTED_QUESTIONS } from './constants';
import type { CopilotChat, ChatTurn } from './useCopilot';

const TurnBubble: FC<{ turn: ChatTurn }> = ({ turn }) => (
  <div
    className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
      turn.role === 'user'
        ? 'ml-8 bg-brand-700 text-white'
        : 'mr-8 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800'
    }`}
  >
    <div className="flex items-center justify-between mb-1 opacity-75 text-[10px] font-semibold uppercase tracking-wider">
      <span>{turn.role === 'user' ? 'You' : <LangText text="Prabandh Copilot (प्रबंध)" />}</span>
      {turn.source && <span>({turn.source})</span>}
    </div>
    <p className="whitespace-pre-line">{turn.text}</p>
  </div>
);

/** Conversation with the plan-grounded AI copilot (live log, suggestions, input form). */
export const CopilotChatbox: FC<{ chat: CopilotChat }> = memo(({ chat }) => {
  const { turns, isAsking, ask, clear } = chat;
  const [input, setInput] = useState('');

  function submit(question: string) {
    setInput('');
    void ask(question);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-700 dark:text-brand-400">
            <Icon name="message" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              Ask the Celebration Copilot
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Grounded in your plan&apos;s real numbers. Answers in English or Hinglish.
            </p>
          </div>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="btn-quiet text-xs text-stone-600 dark:text-stone-400 hover:text-stone-600"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Chat turns (live log so new answers are announced) */}
      <div role="log" aria-label="Copilot conversation" aria-live="polite">
        {turns.length > 0 && (
          <div
            // The transcript scrolls, so it must be keyboard-focusable (WCAG 2.1.1 / axe scrollable-region-focusable).
            role="region"
            aria-label="Copilot messages"
            tabIndex={0}
            className="space-y-3 mb-4 max-h-80 overflow-y-auto p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800"
          >
            {turns.map((turn, i) => (
              <TurnBubble key={`${i}-${turn.role}`} turn={turn} />
            ))}
          </div>
        )}
      </div>

      {turns.length === 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-2">
            Try asking:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => submit(sq)}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:border-brand-500 hover:text-brand-600 transition"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="copilot-input-question"
          aria-label="Ask the celebration copilot a question about budget, vendors or timeline"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'How much contingency do I have left?')"
          className="input-base"
          disabled={isAsking}
        />
        <button
          type="submit"
          aria-label="Ask the copilot"
          disabled={isAsking || !input.trim()}
          className="btn-primary shrink-0"
        >
          {isAsking ? (
            <span
              aria-hidden="true"
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
          ) : (
            'Ask'
          )}
        </button>
      </form>
    </section>
  );
});
CopilotChatbox.displayName = 'CopilotChatbox';
