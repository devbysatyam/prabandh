import { useState, useMemo, type FC } from 'react';
import type { Plan, TaskStatus } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import {
  buildSchedule,
  groupTasksByPhase,
  propagateDelay,
  diffDays,
} from '../engine/timeline';
import { generateIcsCalendar } from '../engine/calendar';

interface TimelineTabProps {
  plan: Plan;
  today: string;
  dispatch: (action: Action) => void;
}

export const TimelineTab: FC<TimelineTabProps> = ({ plan, today, dispatch }) => {
  const schedule = useMemo(() => buildSchedule(plan.tasks, plan.eventDate, today), [plan.tasks, plan.eventDate, today]);
  const groupedPhases = useMemo(() => groupTasksByPhase(schedule), [schedule]);

  const [activeDelayTaskId, setActiveDelayTaskId] = useState<string | null>(null);
  const [delayInput, setDelayInput] = useState<number>(7);

  const completedCount = plan.tasks.filter((t) => t.status === 'done').length;
  const totalCount = plan.tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const overdueCount = schedule.filter((t) => t.isOverdue).length;
  const atRiskCount = schedule.filter((t) => t.isAtRisk && !t.isOverdue).length;

  function handleStatusToggle(taskId: string, currentStatus: TaskStatus) {
    const next: TaskStatus = currentStatus === 'done' ? 'todo' : 'done';
    dispatch({ type: 'setTaskStatus', taskId, status: next });
  }

  function handleApplyDelay(taskId: string) {
    dispatch({ type: 'setTaskDelay', taskId, delayDays: delayInput });
    setActiveDelayTaskId(null);
  }

  function handleDownloadCalendar() {
    const ics = generateIcsCalendar(plan.title, plan.eventDate, schedule, plan.runSheet);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.title.toLowerCase().replace(/\s+/g, '-')}-milestones.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Top summary & progress */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="calendar" className="w-5 h-5 text-indigo-500" />
              Dependency-Aware Timeline DAG
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tasks respect dependencies and lead times. Simulating a delay automatically propagates downstream dates.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCalendar}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Icon name="download" className="w-4 h-4" />
            Download .ICS Calendar
          </button>
        </div>

        {/* Progress & metrics */}
        <div className="py-3 border-y border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Milestones Done</span>
              <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {completedCount} / {totalCount} ({completionPct}%)
              </p>
            </div>
            {overdueCount > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">Overdue</span>
                <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{overdueCount}</p>
              </div>
            )}
            {atRiskCount > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">At Risk</span>
                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{atRiskCount}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64">
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>Readiness</span>
              <span className="font-bold">{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grouped phases */}
      <div className="space-y-6">
        {groupedPhases.map((group) => {
          if (group.tasks.length === 0) return null;
          return (
            <section key={group.phase} className="card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {group.title}
                </h4>
                <span className="text-xs text-stone-400 font-medium">
                  {group.tasks.filter((t) => t.status === 'done').length} of {group.tasks.length} done
                </span>
              </div>

              <div className="space-y-2.5">
                {group.tasks.map((task) => {
                  const isDone = task.status === 'done';
                  const daysRemaining = diffDays(today, task.effectiveDate);
                  const isDelayModalOpen = activeDelayTaskId === task.id;
                  const affectedDownstream = isDelayModalOpen
                    ? propagateDelay(plan.tasks, task.id, delayInput)
                    : [];

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isDone
                          ? 'border-stone-200 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 opacity-75'
                          : task.isOverdue
                          ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                          : task.isAtRisk
                          ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(task.id, task.status)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition ${
                              isDone
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-stone-300 dark:border-stone-700 hover:border-indigo-500'
                            }`}
                          >
                            {isDone && <Icon name="check" className="w-3.5 h-3.5" />}
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`font-semibold text-sm ${
                                  isDone
                                    ? 'line-through text-stone-400 dark:text-stone-500'
                                    : 'text-stone-900 dark:text-stone-100'
                                }`}
                              >
                                {task.title}
                              </p>
                              <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                                {task.category}
                              </span>

                              {/* Status flags */}
                              {task.isOverdue && !isDone && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  ⚠️ Overdue ({Math.abs(daysRemaining)}d ago)
                                </span>
                              )}
                              {task.isAtRisk && !task.isOverdue && !isDone && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  ⏳ At Risk
                                </span>
                              )}
                              {(task.delayDays ?? 0) > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                  Delayed +{task.delayDays}d
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-400 mt-0.5">
                              Target Due: <strong>{task.dueDate}</strong> · Effective Finish: <strong>{task.effectiveDate}</strong>
                              {task.assignee && ` · Lead: ${task.assignee}`}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveDelayTaskId(isDelayModalOpen ? null : task.id)
                            }
                            className="btn-quiet text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                            title="Simulate delay to propagate downstream schedule"
                          >
                            <Icon name="clock" className="w-3.5 h-3.5" />
                            {isDelayModalOpen ? 'Close' : 'Simulate Delay'}
                          </button>
                        </div>
                      </div>

                      {/* Inline delay simulator drawer */}
                      {isDelayModalOpen && (
                        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs bg-stone-50/60 dark:bg-stone-950/40 p-3 rounded-lg">
                          <p className="font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                            Simulate Delay on &ldquo;{task.title}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span>Push back by:</span>
                            {[7, 14, 21, 30].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDelayInput(d)}
                                className={`px-2 py-1 rounded border text-xs font-semibold ${
                                  delayInput === d
                                    ? 'bg-brand-600 text-white border-brand-600'
                                    : 'border-stone-300 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                                }`}
                              >
                                +{d} days
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleApplyDelay(task.id)}
                              className="btn-primary text-xs ml-auto"
                            >
                              Apply Delay
                            </button>
                          </div>

                          {affectedDownstream.length > 0 && (
                            <p className="text-amber-600 dark:text-amber-400 text-[11px]">
                              ⚠️ Will shift {affectedDownstream.length} downstream dependent task(s).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
