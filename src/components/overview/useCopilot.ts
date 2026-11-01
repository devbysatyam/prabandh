import { useCallback, useState } from 'react';
import type { Plan } from '../../schemas';
import { api } from '../../lib/api';
import { COPILOT_ERROR_TEXT } from './constants';

/** One message in the copilot conversation. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

/** State and actions of the "Ask the Celebration Copilot" chat. */
export interface CopilotChat {
  turns: ChatTurn[];
  isAsking: boolean;
  ask: (question: string) => Promise<void>;
  clear: () => void;
}

/** Chat state machine for the copilot: appends turns and calls the grounded Q&A endpoint. */
export function useCopilot(plan: Plan, today: string): CopilotChat {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || isAsking) return;
      setTurns((prev) => [...prev, { role: 'user', text }]);
      setIsAsking(true);
      try {
        const res = await api.askCopilot(text, plan, today);
        const source = res.source === 'gemini' ? 'Gemini AI' : 'Offline Engine';
        setTurns((prev) => [...prev, { role: 'assistant', text: res.answer, source }]);
      } catch {
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', text: COPILOT_ERROR_TEXT, source: 'offline' },
        ]);
      } finally {
        setIsAsking(false);
      }
    },
    [plan, today, isAsking],
  );

  const clear = useCallback(() => setTurns([]), []);

  return { turns, isAsking, ask, clear };
}
