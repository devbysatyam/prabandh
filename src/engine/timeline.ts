import type { Task, TaskPhase } from '../schemas';

/**
 * A task enriched with computed dates and risk flags by {@link buildSchedule}.
 *
 * @example
 * ```ts
 * const t: ScheduledTask = schedule[0];
 * t.isOverdue || t.isAtRisk;
 * ```
 */
export interface ScheduledTask extends Task {
  dueDate: string;
  effectiveDate: string;
  isOverdue: boolean;
  isAtRisk: boolean;
  isImpossible: boolean;
  affectedByDelay: boolean;
  daysRemaining: number;
}

/**
 * Adds integer days to an ISO date deterministically, without time-zone drift (UTC arithmetic).
 *
 * @param isoDate - Date as YYYY-MM-DD.
 * @param days - Days to add (may be negative).
 * @returns The resulting YYYY-MM-DD date.
 * @example
 * ```ts
 * addDays('2026-02-27', 3); // => '2026-03-02'
 * ```
 */
export function addDays(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  const year = parts[0] ?? 2026;
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;

  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Integer day difference between two YYYY-MM-DD dates (`toDate - fromDate`).
 *
 * @param fromDate - Start date.
 * @param toDate - End date.
 * @returns Whole days; negative when `toDate` is earlier.
 * @example
 * ```ts
 * diffDays('2026-01-01', '2026-01-31'); // => 30
 * ```
 */
export function diffDays(fromDate: string, toDate: string): number {
  const p1 = fromDate.split('-').map(Number);
  const p2 = toDate.split('-').map(Number);

  const d1 = Date.UTC(p1[0] ?? 2026, (p1[1] ?? 1) - 1, p1[2] ?? 1);
  const d2 = Date.UTC(p2[0] ?? 2026, (p2[1] ?? 1) - 1, p2[2] ?? 1);

  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Detects cyclic dependencies in the task graph.
 *
 * @param tasks - Tasks with `dependsOn` ids.
 * @returns The offending id path (ending with the repeated id), or `null` when acyclic.
 * @example
 * ```ts
 * detectCycle([
 *   { ...a, dependsOn: ['b'] },
 *   { ...b, dependsOn: ['a'] },
 * ]); // => ['a', 'b', 'a']
 * ```
 */
export function detectCycle(tasks: Task[]): string[] | null {
  const map = new Map<string, Task>();
  for (const t of tasks) map.set(t.id, t);

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let cycleFound: string[] | null = null;

  function dfs(taskId: string, path: string[]): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const task = map.get(taskId);
    if (task) {
      for (const depId of task.dependsOn) {
        if (!visited.has(depId)) {
          if (dfs(depId, [...path])) return true;
        } else if (recursionStack.has(depId)) {
          cycleFound = [...path, depId];
          return true;
        }
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (dfs(t.id, [])) return cycleFound;
    }
  }

  return null;
}

/**
 * Topologically sorts tasks so dependencies come first; unknown dependency ids are ignored and
 * cyclic leftovers are appended in original order.
 *
 * @param tasks - Tasks to order.
 * @returns A new ordered array.
 * @example
 * ```ts
 * topologicalSort(tasks).map((t) => t.id); // => dependencies before dependents
 * ```
 */
export function topologicalSort(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  for (const t of tasks) taskMap.set(t.id, t);

  const { inDegree, dependents } = buildDependencyGraph(tasks, taskMap);

  const sorted = kahnOrder(taskMap, inDegree, dependents);

  // If cycle existed, append any remaining tasks
  if (sorted.length < tasks.length) {
    const seen = new Set(sorted.map((t) => t.id));
    for (const t of tasks) {
      if (!seen.has(t.id)) sorted.push(t);
    }
  }

  return sorted;
}

/** Kahn's algorithm: emit tasks whose dependencies are all emitted (mutates `inDegree`). */
function kahnOrder(
  taskMap: Map<string, Task>,
  inDegree: Map<string, number>,
  dependents: Map<string, string[]>,
): Task[] {
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: Task[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined) break;
    const t = taskMap.get(id);
    if (t) sorted.push(t);

    for (const nextId of dependents.get(id) ?? []) {
      const deg = (inDegree.get(nextId) ?? 1) - 1;
      inDegree.set(nextId, deg);
      if (deg === 0) queue.push(nextId);
    }
  }
  return sorted;
}

/** Build in-degree counts and a dependency -> dependents adjacency map (unknown deps ignored). */
function buildDependencyGraph(
  tasks: Task[],
  taskMap: Map<string, Task>,
): { inDegree: Map<string, number>; dependents: Map<string, string[]> } {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const t of tasks) {
    inDegree.set(t.id, 0);
    dependents.set(t.id, []);
  }
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (taskMap.has(depId)) {
        dependents.get(depId)?.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }
  return { inDegree, dependents };
}

/**
 * Builds the full schedule: nominal and effective dates, dependency pushes, delays and status flags.
 *
 * @param tasks - Plan tasks.
 * @param eventDate - Event date (YYYY-MM-DD); lead times count back from it.
 * @param today - Reference date used for overdue / days remaining.
 * @returns Scheduled tasks in topological order.
 * @example
 * ```ts
 * const schedule = buildSchedule(plan.tasks, plan.eventDate, '2026-11-02');
 * schedule.filter((t) => t.isOverdue);
 * ```
 */
export function buildSchedule(tasks: Task[], eventDate: string, today: string): ScheduledTask[] {
  const sorted = topologicalSort(tasks);
  const effectiveMap = new Map<string, string>();
  const result: ScheduledTask[] = [];

  for (const task of sorted) {
    const nominalDueDate = addDays(eventDate, -task.leadDays);

    // If task has delay, apply it
    const delay = task.delayDays ?? 0;
    let baseEffective = addDays(nominalDueDate, delay);

    // If task depends on other tasks, it cannot finish before dependency effective date + duration
    for (const depId of task.dependsOn) {
      const depEffective = effectiveMap.get(depId);
      if (depEffective) {
        const earliestFinish = addDays(depEffective, task.durationDays);
        if (diffDays(baseEffective, earliestFinish) > 0) {
          baseEffective = earliestFinish;
        }
      }
    }

    effectiveMap.set(task.id, baseEffective);

    const isOverdue = task.status !== 'done' && diffDays(today, baseEffective) < 0;
    const isAtRisk = diffDays(nominalDueDate, baseEffective) > 0;
    const isImpossible = diffDays(eventDate, baseEffective) > 0;
    const daysRemaining = diffDays(today, baseEffective);

    result.push({
      ...task,
      dueDate: nominalDueDate,
      effectiveDate: baseEffective,
      isOverdue,
      isAtRisk,
      isImpossible,
      affectedByDelay: delay > 0 || isAtRisk,
      daysRemaining,
    });
  }

  return result;
}

/** Map each task id to the ids of tasks that directly depend on it. */
function dependentsByTask(tasks: Task[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!map.has(dep)) map.set(dep, []);
      map.get(dep)?.push(t.id);
    }
  }
  return map;
}

/**
 * Finds every downstream task affected when a task is delayed.
 *
 * @param tasks - Plan tasks.
 * @param delayedTaskId - Task that slips.
 * @param delayDays - Days of slippage (non-positive means no effect).
 * @returns Ids of all transitive dependents (empty when `delayDays <= 0`).
 * @example
 * ```ts
 * propagateDelay(plan.tasks, 'venue-booking', 14); // => ['decor-brief', 'invites']
 * ```
 */
export function propagateDelay(tasks: Task[], delayedTaskId: string, delayDays: number): string[] {
  if (delayDays <= 0) return [];
  const map = dependentsByTask(tasks);

  const affected = new Set<string>();
  const queue = [delayedTaskId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const dependents = map.get(current) ?? [];
    for (const dep of dependents) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }

  return Array.from(affected);
}

/**
 * Compresses lead times proportionally when the runway is shorter than the longest lead time.
 *
 * @param tasks - Plan tasks.
 * @param availableRunwayDays - Days between today and the event.
 * @returns Tasks with scaled `leadDays` / `durationDays` (each at least 1), or the input when no compression is needed.
 * @example
 * ```ts
 * compressTasks(tasks, 30).every((t) => t.leadDays <= 30); // => true
 * ```
 */
export function compressTasks(tasks: Task[], availableRunwayDays: number): Task[] {
  if (tasks.length === 0 || availableRunwayDays <= 0) return tasks;
  const maxLead = Math.max(...tasks.map((t) => t.leadDays));
  if (maxLead <= availableRunwayDays) return tasks;

  const scale = availableRunwayDays / maxLead;

  return tasks.map((t) => {
    const scaledLead = Math.max(1, Math.floor(t.leadDays * scale));
    const scaledDuration = Math.max(1, Math.min(scaledLead, Math.floor(t.durationDays * scale)));
    return {
      ...t,
      leadDays: scaledLead,
      durationDays: scaledDuration,
    };
  });
}

/**
 * Groups scheduled tasks by planning phase for chunked display.
 *
 * @param tasks - Scheduled tasks.
 * @returns The five phases in order, each with its title and tasks (tasks without a phase fall in final_prep).
 * @example
 * ```ts
 * groupTasksByPhase(schedule)[0]?.title; // => '1. Foundation & Venue Locking'
 * ```
 */
export function groupTasksByPhase(
  tasks: ScheduledTask[],
): { phase: TaskPhase; title: string; tasks: ScheduledTask[] }[] {
  const phaseOrder: { phase: TaskPhase; title: string }[] = [
    { phase: 'foundation', title: '1. Foundation & Venue Locking' },
    { phase: 'vendor_booking', title: '2. Major Vendor Contracts' },
    { phase: 'creative_invites', title: '3. Creative Design & Invitations' },
    { phase: 'final_prep', title: '4. Final Preparations & Headcount' },
    { phase: 'event_week', title: '5. Event Week & Day-of Readiness' },
  ];

  return phaseOrder.map((group) => ({
    phase: group.phase,
    title: group.title,
    tasks: tasks.filter((t) => (t.phase ?? 'final_prep') === group.phase),
  }));
}
