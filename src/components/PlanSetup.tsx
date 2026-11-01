import { useState, type FC, type FormEvent } from 'react';
import type { Category, Intake, Occasion, Plan } from '../schemas';
import { PRIORITY_ITEMS } from '../schemas';
import { Icon } from './Icon';
import { formatINR, parseINR } from '../engine/money';
import { api } from '../lib/api';

interface PlanSetupProps {
  plan?: Plan | null;
  onCreate?: (intake: Intake) => void;
  onUpdate?: (intake: Intake) => void;
  onLoadSample?: () => void;
  today: string;
}

const PRESET_EXAMPLES = [
  {
    label: 'Grand Pune Shaadi (200 guests, ₹15 Lakh)',
    text: 'Grand Punjabi Shaadi in Pune, 200 guests, 15 lakh budget, late December. We care most about royal catering and candid cinematography.',
  },
  {
    label: "Kid's 7th Birthday Party (60 guests, ₹85,000)",
    text: "Superhero themed 7th birthday celebration for my son, 60 guests, 85000 budget, next month. Games, magic show, and delicious snack boxes are top priorities.",
  },
  {
    label: 'Parents 50th Golden Anniversary (120 guests, ₹6 Lakh)',
    text: 'Golden Jubilee 50th Wedding Anniversary for parents, 120 guests, 6 lakh budget. Warm nostalgic vibe, acoustic ghazals, memory tribute, and comfortable elder seating.',
  },
  {
    label: 'Community Diwali Utsav (500 guests, ₹4 Lakh)',
    text: 'Society Diwali & Cultural Festival, 500 guests, 4 lakh budget. Focus on community bhandara feast, stage lightings, and security permits.',
  },
];

export const PlanSetup: FC<PlanSetupProps> = ({
  plan,
  onCreate,
  onUpdate,
  onLoadSample,
  today,
}) => {
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);

  // Structured form state
  const [occasion, setOccasion] = useState<Occasion>(plan?.occasion ?? 'wedding');
  const [budgetString, setBudgetString] = useState(plan ? String(plan.totalBudget) : '1500000');
  const [guests, setGuests] = useState(plan?.guests ?? 200);
  const [eventDate, setEventDate] = useState(() => {
    if (plan?.eventDate) return plan.eventDate;
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return d.toISOString().slice(0, 10);
  });
  const [vibe, setVibe] = useState(
    plan?.vibe ?? 'Warm, elegant celebration with close family and delicious royal food',
  );
  const [city, setCity] = useState(plan?.city ?? 'Pune');
  const [priorityKeys, setPriorityKeys] = useState<string[]>(
    plan?.priorityKeys && plan.priorityKeys.length > 0
      ? plan.priorityKeys
      : ['catering', 'photography'],
  );

  async function handleAiParse() {
    if (!description.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParseSuccess(null);
    try {
      const result = await api.parseIntake(description);
      setOccasion(result.occasion);
      setBudgetString(String(result.totalBudget));
      setGuests(result.guests);
      if (result.eventDate) setEventDate(result.eventDate);
      if (result.vibe) setVibe(result.vibe);
      if (result.city) setCity(result.city);
      if (result.priorities && result.priorities.length > 0) {
        const matchingKeys = PRIORITY_ITEMS.filter((item) =>
          result.priorities.includes(item.category as (typeof result.priorities)[number]),
        ).map((item) => item.id);
        if (matchingKeys.length > 0) {
          setPriorityKeys(matchingKeys);
        }
      }
      setParseSuccess(
        `✨ Vision recognized: ${result.guests} guests, ${formatINR(result.totalBudget)}, ${result.eventDate} in ${result.city || 'your city'}. Review values below and click Create / Save.`,
      );
    } catch {
      setParseError('Could not parse text automatically. You can fill the form fields below manually.');
    } finally {
      setIsParsing(false);
    }
  }

  function togglePriorityKey(id: string) {
    setPriorityKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedBudget = parseINR(budgetString) ?? 1000000;

    const selectedItems = PRIORITY_ITEMS.filter((item) => priorityKeys.includes(item.id));
    const uniqueCategories = Array.from(
      new Set(selectedItems.map((item) => item.category)),
    ).filter((c): c is Exclude<Category, 'contingency'> => c !== 'contingency');

    const intake: Intake = {
      occasion,
      totalBudget: Math.max(10000, parsedBudget),
      guests: Math.max(1, guests),
      eventDate,
      vibe,
      city: city.trim() || undefined,
      priorities: uniqueCategories.length > 0 ? uniqueCategories : ['catering'],
      priorityKeys,
    };

    if (plan && onUpdate) {
      onUpdate(intake);
    } else if (onCreate) {
      onCreate(intake);
    }
  }

  const currentParsedBudget = parseINR(budgetString) ?? 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Editing existing plan alert */}
      {plan && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✏️</span>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Editing Live Plan: {plan.title}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Updating your vision re-tunes budget allocations and catering formulas without losing your custom guest list or vendors.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Live Connected Mode
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-3">
          {plan ? 'Prabandh · प्रबंध · Section 1: Event Vision & Parameters' : 'Prabandh · प्रबंध · Step 1: Define Your Event'}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
          Plan the Celebration, Not the Spreadsheet
        </h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
          Describe your vision in plain English or Hinglish. Prabandh&apos;s connected engine builds your
          complete budget, venue fit, timeline, vendor checklist, and run sheet in under a second.
        </p>

        {/* Demo celebration quick load button */}
        {!plan && onLoadSample && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-sm transition hover:scale-102"
            >
              <Icon name="sparkle" className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Explore Interactive Sample Celebration (डेमो शादी देखें)</span>
              <span className="text-[11px] opacity-75">→ Instant 9-Section Tour</span>
            </button>
          </div>
        )}
      </div>

      {/* Free text AI Intake Card */}
      <section className="card mb-8 border-brand-200 dark:border-brand-900/60 shadow-lg shadow-brand-500/5 bg-gradient-to-b from-brand-50/30 to-white dark:from-brand-950/20 dark:to-stone-900">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="sparkle" className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
            Natural Language Event Intake
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
          Type or paste anything: budget (e.g. &quot;15 lakh&quot; or &quot;₹15,00,000&quot;), guest count, dates, city, and what matters most.
        </p>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Shaadi in Pune, 200 guests, 15 lakh budget, mid-December. We want royal catering and cinematic photography."
          className="input-base text-sm resize-none"
        />

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-stone-400">Quick ideas:</span>
          {PRESET_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDescription(ex.text);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-brand-100 dark:hover:bg-brand-950 hover:text-brand-800 dark:hover:text-brand-200 transition"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {parseError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{parseError}</p>
          )}
          {parseSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
              <span>{parseSuccess}</span>
              <button
                type="button"
                onClick={() => setParseSuccess(null)}
                className="text-emerald-500 hover:text-emerald-700 ml-2"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAiParse}
              disabled={isParsing || !description.trim()}
              className="btn-primary"
            >
              {isParsing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Parsing Vision with Gemini...
                </>
              ) : (
                <>
                  <Icon name="sparkle" className="w-4 h-4" />
                  Fill Form From Description
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Structured Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            1. Select Occasion Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'wedding', label: 'Wedding / Shaadi', icon: '💍', desc: 'Sangeet, Mandap, Feast' },
              { id: 'kids_birthday', label: "Kid's Birthday", icon: '🎂', desc: 'Themes, Games, Cakes' },
              { id: 'milestone', label: 'Milestone Jubilee', icon: '🏆', desc: '50th/60th, AV Tribute' },
              { id: 'community', label: 'Community Gala', icon: '🪔', desc: 'Festivals & Bhandaras' },
            ].map((item) => {
              const isSelected = occasion === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOccasion(item.id as Occasion)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40'
                  }`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-stone-900 dark:text-stone-100'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="budget-input" className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Total Budget (INR ₹)
              </label>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {formatINR(currentParsedBudget)}
              </span>
            </div>
            <input
              id="budget-input"
              type="text"
              value={budgetString}
              onChange={(e) => setBudgetString(e.target.value)}
              placeholder="e.g. 15 lakh, 8L, 2000000"
              className="input-base"
              required
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Supports &quot;15 lakh&quot;, &quot;8.5L&quot;, &quot;2 crore&quot;, or exact numbers.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="guests-input" className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Target Guest Headcount
              </label>
              <span className="text-xs text-stone-500">
                ~{formatINR(currentParsedBudget > 0 && guests > 0 ? Math.round((currentParsedBudget * 0.35) / guests) : 0)}/plate
              </span>
            </div>
            <input
              id="guests-input"
              type="number"
              min={1}
              max={100000}
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value || '1', 10))}
              className="input-base"
              required
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Directly drives catering allocations and vendor minimum guarantees.
            </p>
          </div>
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
              Celebration Date
            </label>
            <input
              id="date-input"
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input-base"
              required
            />
          </div>

          <div>
            <label htmlFor="city-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
              City / Destination
            </label>
            <input
              id="city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune, Jaipur, Delhi, Mumbai"
              className="input-base"
            />
          </div>
        </div>

        {/* Vibe */}
        <div>
          <label htmlFor="vibe-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
            Celebration Mood & Style
          </label>
          <input
            id="vibe-input"
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g. Royal traditional, rustic outdoor garden, high energy Bollywood"
            className="input-base"
          />
        </div>

        {/* Priorities: What matters most (Expanded 9 authentic celebration priorities) */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                2. What Matters Most? (Priorities get +25% weight boost)
              </label>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Select celebration focus areas. The allocation algorithm applies a deterministic +25% weight multiplier to each chosen dimension.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              {priorityKeys.length} selected (+25% boost active)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRIORITY_ITEMS.map((item) => {
              const isSelected = priorityKeys.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePriorityKey(item.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      {isSelected ? '+25% Boost' : 'Normal'}
                    </span>
                  </div>

                  <div>
                    <p className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-stone-900 dark:text-stone-100'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-3 text-base">
            {plan ? 'Update Connected Celebration Parameters →' : 'Build Connected Plan →'}
          </button>
        </div>
      </form>
    </div>
  );
};
