import { localAnswer, planFacts } from '../../engine/advisor';
import { clampText, fenceUntrusted, PROMPT_GUARD } from '../../lib/sanitize';
import type { RequestBody } from '../security';
import type { ApiResponse } from '../types';
import { generate, getAiClient } from './gemini';

const MAX_QUESTION_CHARS = 500;
const MAX_FACTS_CHARS = 12_000;
const MAX_ANSWER_CHARS = 1500;

function buildPrompt(facts: string, question: string): string {
  return `You are Prabandh's (प्रबंध) AI planning copilot: a warm, expert Indian celebration planner chatting with a family.
Ground every answer strictly in the facts provided below. Never invent vendor rates or prices.
${PROMPT_GUARD}

Plan Facts:
${fenceUntrusted('plan_facts', facts, MAX_FACTS_CHARS)}

User Question:
${fenceUntrusted('user_text', question, MAX_QUESTION_CHARS)}

Answer directly, warmly, and concisely (under 120 words) in English or Hinglish. Quote exact figures from the facts.`;
}

/** POST /api/ask-copilot: answers a family question grounded in the plan facts. */
export async function handleAskCopilot(body: RequestBody<'ask-copilot'>): Promise<ApiResponse> {
  const question = clampText(body.question, MAX_QUESTION_CHARS);
  const { plan } = body;
  const today = body.today ?? new Date().toISOString().slice(0, 10);
  if (!question) return { status: 400, data: { error: 'Question and plan are required' } };

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await generate(ai, buildPrompt(planFacts(plan, today), question), false);
      return {
        status: 200,
        data: {
          answer: clampText(response.text, MAX_ANSWER_CHARS) || localAnswer(question, plan, today),
          source: 'gemini',
        },
      };
    } catch {
      // Fall through to deterministic local planner
    }
  }
  return {
    status: 200,
    data: { answer: localAnswer(question, plan, today), source: 'local_deterministic' },
  };
}
