import type { IdeasResponse, Intake, Plan, PlanReview, Quote } from '../schemas';

export async function postApi<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  parseIntake: (text: string) => postApi<Intake>('parse-intake', { text }),
  extractQuote: (text: string, category: string) =>
    postApi<Quote>('extract-quote', { text, category }),
  askCopilot: (question: string, plan: Plan, today?: string) =>
    postApi<{ answer: string; source: string }>('ask-copilot', { question, plan, today }),
  suggestIdeas: (occasion: string, vibe: string, guests: number, totalBudget: number) =>
    postApi<IdeasResponse>('suggest-ideas', { occasion, vibe, guests, totalBudget }),
  reviewPlan: (plan: Plan, today?: string) => postApi<PlanReview>('review-plan', { plan, today }),
};
