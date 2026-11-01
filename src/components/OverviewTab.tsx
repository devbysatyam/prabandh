import { useState, useMemo, type FC, type FormEvent } from 'react';
import type { Plan, PlanReview } from '../schemas';
import type { TabId } from './Navigation';
import { Icon } from './Icon';
import { budgetStatus, planInsights, diffDays, formatINR, toLakh } from '../engine';
import { aggregateGuests } from '../engine/guests';
import { api } from '../lib/api';

interface OverviewTabProps {
  plan: Plan;
  today: string;
  onNavigate: (tab: TabId) => void;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  source?: string;
}

const SUGGESTED_QUESTIONS = [
  'Are we over budget right now?',
  'What should I book or complete next?',
  'What is the current RSVP breakdown?',
  'How do I politely negotiate with the caterer?',
];

export const OverviewTab: FC<OverviewTabProps> = ({ plan, today, onNavigate }) => {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const guests = useMemo(() => aggregateGuests(plan.guestList), [plan.guestList]);
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const daysLeft = diffDays(today, plan.eventDate);

  // Copilot Chat state
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Plan review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<PlanReview | null>(null);

  async function handleAsk(q: string) {
    const text = q.trim();
    if (!text || isAsking) return;
    setTurns((prev) => [...prev, { role: 'user', text }]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const res = await api.askCopilot(text, plan, today);
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          source: res.source === 'gemini' ? 'Gemini AI' : 'Offline Engine',
        },
      ]);
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I had trouble answering that right now. Please try again.',
          source: 'offline',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  function handleQuestionSubmit(e: FormEvent) {
    e.preventDefault();
    void handleAsk(inputQuestion);
  }

  async function handleRunReview() {
    setIsReviewing(true);
    try {
      const res = await api.reviewPlan(plan, today);
      setReview(res);
    } catch {
      // Fallback review
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total budget */}
        <div className="card">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
            <Icon name="wallet" className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-sans tracking-tight">
            {formatINR(status.total)}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {toLakh(status.total)} · {formatINR(plan.perPlate)}/plate
          </p>
        </div>

        {/* Committed spend */}
        <div className="card">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Committed Contracts
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {formatINR(status.committed)}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {status.isOverBudget ? (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                Over by {formatINR(status.overBy)}
              </span>
            ) : (
              `${formatINR(status.total - status.committed)} buffer left`
            )}
          </p>
        </div>

        {/* Headcount */}
        <div className="card">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Guests</span>
            <Icon name="users" className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {plan.guests}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {guests.totalEntries > 0
              ? `${guests.confirmedCount} confirmed (${guests.confirmationRate}%)`
              : 'Add guests in Guests tab'}
          </p>
        </div>

        {/* Days left */}
        <div className="card">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Timeline</span>
            <Icon name="clock" className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {daysLeft > 0 ? `${daysLeft} Days` : 'Today!'}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Date: {plan.eventDate}</p>
        </div>
      </div>

      {/* Direct Section Explorer (सीधा अनुभाग दौरा) */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <span>⚡</span> Direct Section Explorer (सीधा अनुभाग दौरा)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Jump directly into any section to inspect, compare quotes, review logged visits, or
              edit celebration details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('venues')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>🏛️ Venues & Recce</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {(plan.venues ?? []).length} properties · {(plan.siteVisits ?? []).length} site recce
              logged
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('vendors')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>🤝 Vendors & Tastings</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {plan.vendors.length} vendors · {(plan.vendorMeetings ?? []).length} tastings & trials
              logged
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>💰 Budget Allocation</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {formatINR(status.total)} · Sliders & Trade-offs
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('guests')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>👥 Guest List & RSVP</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {guests.totalEntries} families ({guests.totalInvitedCount} seats) · WhatsApp
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('timeline')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>📅 Milestone Timeline</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {plan.tasks.length} tasks with dependency chains
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('runsheet')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>⏱️ Day-of Runsheet</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {plan.runSheet.length} itinerary blocks with POCs
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ideas')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>🎨 AI Creative Themes</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              6 curated themes & cost-saving ideas
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="p-3.5 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/20 dark:bg-brand-950/20 hover:border-brand-500 hover:bg-brand-50/50 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-brand-900 dark:text-brand-200 mb-1">
              <span>📊 Analytics & Readiness</span>
              <span className="text-brand-500 group-hover:text-brand-700 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Unit economics, 4-pillar scores & benchmarks
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('setup')}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-brand-500 hover:bg-stone-50 dark:hover:bg-stone-900/60 text-left transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 mb-1">
              <span>⚙️ Vision & Priorities</span>
              <span className="text-stone-400 group-hover:text-brand-600 transition">→</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Edit city, budget & +25% priority weights
            </p>
          </button>
        </div>
      </section>

      {/* Plan Health & AI Review Banner */}
      <section className="card bg-gradient-to-r from-stone-900 to-stone-800 text-white dark:from-stone-900 dark:to-stone-950 p-6 border-none shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
              <Icon name="sparkle" className="w-3.5 h-3.5" />
              Intelligent Plan Review
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {review
                ? `Plan Health Score: ${review.healthScore}/100`
                : 'Run an Automated Readiness & Risk Analysis'}
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              {review
                ? review.summary
                : 'Analyzes your budget gaps, overdue dependency chains, and unconfirmed vendor categories into concrete next steps.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunReview}
            disabled={isReviewing}
            className="btn-primary bg-brand-500 hover:bg-brand-600 border-none text-white font-semibold"
          >
            {isReviewing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Facts...
              </>
            ) : (
              <>
                <Icon name="sparkle" className="w-4 h-4" />
                {review ? 'Re-Analyze Plan' : 'Review Plan with AI'}
              </>
            )}
          </button>
        </div>

        {review && review.recommendedActions && (
          <div className="mt-5 pt-5 border-t border-stone-700/80 grid grid-cols-1 md:grid-cols-3 gap-3">
            {review.recommendedActions.map((action, i) => (
              <div key={i} className="rounded-xl bg-stone-800/80 p-3.5 border border-stone-700/50">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                  Priority Action {i + 1}
                </span>
                <p className="font-semibold text-sm mt-1 text-white">{action.title}</p>
                <p className="text-xs text-stone-300 mt-1">{action.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Proactive Priority Insights */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="alert" className="w-4 h-4 text-brand-600" />
              What Needs Your Attention
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ranked deterministically across budget, timeline dependencies, and vendor bookings.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            {insights.length} Insight{insights.length === 1 ? '' : 's'}
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <Icon name="check" className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">All Systems Running Smoothly!</p>
            <p className="text-xs text-stone-400 mt-1">
              No budget deficits or overdue timeline tasks detected.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="py-3.5 flex flex-wrap items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  <div className="mt-0.5 shrink-0">
                    {insight.severity === 'critical' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 block ring-4 ring-red-100 dark:ring-red-950/60" />
                    ) : insight.severity === 'warning' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block ring-4 ring-amber-100 dark:ring-amber-950/60" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500 block ring-4 ring-brand-100 dark:ring-brand-950/60" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          insight.severity === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : insight.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                        }`}
                      >
                        {insight.severity}
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {insight.title}
                      </p>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      {insight.detail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(insight.tab)}
                  className="btn-quiet text-brand-700 dark:text-brand-400 font-semibold shrink-0"
                >
                  Open {insight.tab.charAt(0).toUpperCase() + insight.tab.slice(1)} →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Copilot Chatbox */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600">
              <Icon name="message" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                Ask the Celebration Copilot
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Grounded in your plan&apos;s real numbers. Answers in English or Hinglish.
              </p>
            </div>
          </div>
          {turns.length > 0 && (
            <button
              type="button"
              onClick={() => setTurns([])}
              className="btn-quiet text-xs text-stone-400 hover:text-stone-600"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat turns */}
        {turns.length > 0 && (
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800">
            {turns.map((turn, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  turn.role === 'user'
                    ? 'ml-8 bg-brand-600 text-white'
                    : 'mr-8 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1 opacity-75 text-[10px] font-semibold uppercase tracking-wider">
                  <span>{turn.role === 'user' ? 'You' : 'Prabandh Copilot (प्रबंध)'}</span>
                  {turn.source && <span>({turn.source})</span>}
                </div>
                <p className="whitespace-pre-line">{turn.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Suggested questions chips */}
        {turns.length === 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-medium text-stone-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAsk(sq)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:border-brand-500 hover:text-brand-600 transition"
                >
                  &ldquo;{sq}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleQuestionSubmit} className="flex gap-2">
          <input
            id="copilot-input-question"
            aria-label="Ask the celebration copilot a question about budget, vendors or timeline"
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask anything (e.g. 'How much contingency do I have left?')"
            className="input-base"
            disabled={isAsking}
          />
          <button
            type="submit"
            aria-label="Submit question to celebration copilot"
            disabled={isAsking || !inputQuestion.trim()}
            className="btn-primary shrink-0"
          >
            {isAsking ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Ask'
            )}
          </button>
        </form>
      </section>
    </div>
  );
};
