import type { Task, TaskPhase } from '../schemas';

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
 * Adds integer days to an ISO date (YYYY-MM-DD) deterministically without time zone drift.
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
 * Calculates integer difference in days between two YYYY-MM-DD dates: (toDate - fromDate).
 */
export function diffDays(fromDate: string, toDate: string): number {
  const p1 = fromDate.split('-').map(Number);
  const p2 = toDate.split('-').map(Number);

  const d1 = Date.UTC(p1[0] ?? 2026, (p1[1] ?? 1) - 1, p1[2] ?? 1);
  const d2 = Date.UTC(p2[0] ?? 2026, (p2[1] ?? 1) - 1, p2[2] ?? 1);

  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Detects cyclic dependencies in task graph. Returns cycle array if found, null if clean.
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
 * Topological sort of tasks respecting dependencies.
 */
export function topologicalSort(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  for (const t of tasks) taskMap.set(t.id, t);

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }

  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (taskMap.has(depId)) {
        adj.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: Task[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const t = taskMap.get(id);
    if (t) sorted.push(t);

    for (const nextId of adj.get(id) ?? []) {
      const deg = (inDegree.get(nextId) ?? 1) - 1;
      inDegree.set(nextId, deg);
      if (deg === 0) queue.push(nextId);
    }
  }

  // If cycle existed, append any remaining tasks
  if (sorted.length < tasks.length) {
    const seen = new Set(sorted.map((t) => t.id));
    for (const t of tasks) {
      if (!seen.has(t.id)) sorted.push(t);
    }
  }

  return sorted;
}

/**
 * Builds full schedule with DAG dates, delay propagation, and status flags.
 */
export function buildSchedule(
  tasks: Task[],
  eventDate: string,
  today: string,
): ScheduledTask[] {
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

/**
 * Propagate delay: identifies all downstream tasks affected when a task is delayed.
 */
export function propagateDelay(
  tasks: Task[],
  delayedTaskId: string,
  delayDays: number,
): string[] {
  if (delayDays <= 0) return [];
  const map = new Map<string, string[]>();
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!map.has(dep)) map.set(dep, []);
      map.get(dep)!.push(t.id);
    }
  }

  const affected = new Set<string>();
  const queue = [delayedTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
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
 * Compresses tasks when runway before event is less than max lead days.
 * Preserves topological order and ensures no task starts in the past.
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
 * Groups tasks by planning phase for clean chunked display (Miller's Law).
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
