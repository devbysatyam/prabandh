import { useState, type FC } from 'react';
import type { Plan } from '../schemas';
import { Icon } from './Icon';
import { diffDays, formatINR } from '../engine';
import { encodePlanShareLink } from '../state/planStore';
import { generateIcsCalendar } from '../engine/calendar';
import { buildSchedule } from '../engine/timeline';

interface HeaderProps {
  plan: Plan | null;
  today: string;
  onReset: () => void;
  onOpenWhatsAppModal: () => void;
}

export const Header: FC<HeaderProps> = ({
  plan,
  today,
  onReset,
  onOpenWhatsAppModal,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function handleShareLink() {
    if (!plan) return;
    const url = encodePlanShareLink(plan);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  }

  function handleDownloadCalendar() {
    if (!plan) return;
    const schedule = buildSchedule(plan.tasks, plan.eventDate, today);
    const icsContent = generateIcsCalendar(plan.title, plan.eventDate, schedule, plan.runSheet);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.toLowerCase().replace(/\s+/g, '-')}-calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const daysLeft = plan ? diffDays(today, plan.eventDate) : 0;

  return (
    <header className="border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-gold-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <span className="font-serif text-xl font-bold">प्र</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 dark:text-stone-50 tracking-tight text-lg sm:text-xl">
                Prabandh <span className="text-brand-600 dark:text-brand-400 font-extrabold text-sm uppercase px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">प्रबंध</span>
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              प्रबंध · Connected Indian Celebration Architecture
            </p>
          </div>
        </div>

        {/* Plan metadata pills */}
        {plan && (
          <div className="hidden lg:flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {daysLeft > 0 ? `${daysLeft} days to go` : 'Celebration Day!'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Icon name="users" className="w-3.5 h-3.5" />
              {plan.guests} Guests
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gold-50 dark:bg-gold-950 text-gold-700 dark:text-gold-300 border border-gold-200 dark:border-gold-800">
              <Icon name="wallet" className="w-3.5 h-3.5" />
              {formatINR(plan.totalBudget)}
            </span>
          </div>
        )}

        {/* Global actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {plan && (
            <>
              {/* WhatsApp Family broadcast */}
              <button
                type="button"
                onClick={onOpenWhatsAppModal}
                className="btn-quiet text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                title="Send update to family WhatsApp group"
              >
                <Icon name="whatsapp" className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {/* Download Calendar */}
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="btn-quiet text-stone-700 dark:text-stone-300"
                title="Download .ics calendar"
              >
                <Icon name="calendar" className="w-4 h-4" />
                <span className="hidden md:inline">Calendar</span>
              </button>

              {/* Share link */}
              <button
                type="button"
                onClick={handleShareLink}
                className="btn-quiet text-stone-700 dark:text-stone-300"
                title="Copy shareable link"
              >
                <Icon name="share" className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {copiedShare ? 'Link Copied!' : 'Share'}
                </span>
              </button>

              {/* Print Summary */}
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-quiet text-stone-700 dark:text-stone-300"
                title="Print plan summary"
              >
                <Icon name="print" className="w-4 h-4" />
                <span className="hidden md:inline">Print</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset your plan?')) {
                    onReset();
                  }
                }}
                className="btn-quiet text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Reset Plan"
              >
                <Icon name="reset" className="w-4 h-4" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            </>
          )}

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Toggle theme"
          >
            <Icon name={darkMode ? 'sun' : 'moon'} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
