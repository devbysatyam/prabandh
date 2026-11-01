import { useState, useMemo, type FC, type FormEvent } from 'react';
import type { Plan, RunSheetItem } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { formatRunSheetWhatsapp, sortRunSheet } from '../engine/runsheet';

interface RunSheetTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

export const RunSheetTab: FC<RunSheetTabProps> = ({ plan, dispatch }) => {
  const sortedItems = useMemo(() => sortRunSheet(plan.runSheet), [plan.runSheet]);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // New item modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [time, setTime] = useState('18:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coordinator, setCoordinator] = useState('');

  function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;

    const newItem: RunSheetItem = {
      id: `rs-${Date.now()}`,
      time,
      title: title.trim(),
      description: description.trim() || undefined,
      coordinator: coordinator.trim() || undefined,
      status: 'pending',
    };

    dispatch({ type: 'addRunSheetItem', item: newItem });
    setTitle('');
    setDescription('');
    setCoordinator('');
    setShowAddModal(false);
  }

  function handleCopyWhatsapp() {
    const text = formatRunSheetWhatsapp(plan.runSheet, plan.title, plan.eventDate);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2500);
    });
  }

  const completedCount = plan.runSheet.filter((i) => i.status === 'completed').length;
  const inProgressCount = plan.runSheet.filter((i) => i.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="clock" className="w-5 h-5 text-brand-600" />
              Day-of Master Itinerary & Live Run Sheet
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Hour-by-hour schedule on the day of the event with assigned family leads and real-time status toggles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="btn-secondary text-xs"
            >
              <Icon name="whatsapp" className="w-4 h-4 text-emerald-500" />
              {copiedWhatsapp ? 'Copied to Clipboard!' : 'Broadcast to Family WhatsApp'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs"
            >
              <Icon name="plus" className="w-4 h-4" />
              Add Itinerary Block
            </button>
          </div>
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-stone-100 dark:border-stone-800 text-center">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total Blocks</span>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">{plan.runSheet.length}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">In Progress</span>
            <p className="text-xl font-extrabold text-amber-600">{inProgressCount}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Completed</span>
            <p className="text-xl font-extrabold text-emerald-600">{completedCount}</p>
          </div>
        </div>
      </section>

      {/* Add Block Form */}
      {showAddModal && (
        <form onSubmit={handleAddItem} className="card border-brand-300 dark:border-brand-900 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Add New Itinerary Block
            </h4>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Time (HH:MM, 24-hr)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-base text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Ceremony / Activity Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Varmala Ceremony / High Tea Buffet Opens"
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Designated Lead Coordinator
              </label>
              <input
                type="text"
                value={coordinator}
                onChange={(e) => setCoordinator(e.target.value)}
                placeholder="e.g. Mami & Chachi / Uncle Rajesh"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Logistical Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Assemble at front gate; flower petals ready"
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Block
            </button>
          </div>
        </form>
      )}

      {/* Chronological Itinerary Feed */}
      <section className="card space-y-3">
        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider pb-2 border-b border-stone-100 dark:border-stone-800">
          Chronological Order of Events
        </h4>

        <div className="space-y-3">
          {sortedItems.map((item) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : isInProgress
                    ? 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className="font-mono font-bold text-sm px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 block">
                      {item.time}
                    </span>
                  </div>

                  <div>
                    <h5
                      className={`font-bold text-base ${
                        isCompleted
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {item.title}
                    </h5>
                    {item.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {item.coordinator && (
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1 flex items-center gap-1">
                        <span>👤 In-Charge:</span>
                        <span>{item.coordinator}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'cycleRunSheet', itemId: item.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isInProgress
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-brand-500'
                  }`}
                >
                  {isCompleted ? '✓ Completed' : isInProgress ? '⏳ In Progress' : '📌 Mark Active'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
