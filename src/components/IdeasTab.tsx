import { useState, useEffect, type FC } from 'react';
import type { IdeasResponse, Plan } from '../schemas';
import { Icon } from './Icon';
import { api } from '../lib/api';

interface IdeasTabProps {
  plan: Plan;
}

export const IdeasTab: FC<IdeasTabProps> = ({ plan }) => {
  const [ideas, setIdeas] = useState<IdeasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  async function loadIdeas() {
    setLoading(true);
    try {
      const res = await api.suggestIdeas(plan.occasion, plan.vibe, plan.guests, plan.totalBudget);
      setIdeas(res);
    } catch {
      // Fallback handled by handler
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIdeas();
  }, [plan.occasion, plan.vibe]);

  function handleCopyInvite() {
    if (!ideas?.invitationLine) return;
    navigator.clipboard.writeText(ideas.invitationLine).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
            <Icon name="sparkle" className="w-5 h-5 text-brand-600" />
            Curated Inspiration & Personal Touches
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Occasion-tuned themes, authentic food styles, interactive activities, and invitation wording. (No commercial prices or brand sponsorships).
          </p>
        </div>

        <button
          type="button"
          onClick={loadIdeas}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="sparkle" className="w-3.5 h-3.5 text-brand-600" />
          )}
          {loading ? 'Curating Ideas...' : 'Regenerate Ideas'}
        </button>
      </section>

      {ideas && (
        <div className="space-y-6">
          {/* Invitation Line Feature Card */}
          <section className="card border-brand-200 dark:border-brand-900/60 bg-gradient-to-r from-brand-50/50 via-white to-gold-50/30 dark:from-brand-950/20 dark:via-stone-900 dark:to-gold-950/20 p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 block mb-1">
              Bespoke Invitation Line
            </span>
            <p className="font-serif italic text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-relaxed">
              &ldquo;{ideas.invitationLine}&rdquo;
            </p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="btn-quiet text-brand-600 dark:text-brand-400 font-semibold"
              >
                {copiedInvite ? '✓ Copied Wording' : 'Copy Invitation Text'}
              </button>
            </div>
          </section>

          {/* Theme concepts */}
          <section className="card space-y-4">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
              Aesthetic & Decor Themes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ideas.themes.map((theme, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 hover:border-brand-400 transition"
                >
                  <span className="text-brand-600 text-xs font-bold">Concept {i + 1}</span>
                  <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                    {theme.title}
                  </h5>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Food and Activities side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Culinary / Food Styles */}
            <section className="card space-y-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
                Culinary Highlights & Live Counters
              </h4>
              <ul className="space-y-2">
                {ideas.foodStyle.map((dish, i) => (
                  <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                    <span className="text-brand-600 mt-0.5">🍲</span>
                    <span>{dish}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Interactive Activities */}
            <section className="card space-y-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
                Guest Engagement & Activities
              </h4>
              <ul className="space-y-2">
                {ideas.activities.map((act, i) => (
                  <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">✨</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Personal Touches */}
          <section className="card space-y-3">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
              Heartfelt Personal Touches
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ideas.personalTouches.map((touch, i) => (
                <div key={i} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                  <p>{touch}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
