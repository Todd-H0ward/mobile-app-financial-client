import { listTasks } from '../catalogue';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Tasks still open for this period, in catalogue (file) order.
 *
 * Unlock rule for the mandatory scenario: every task is available at once —
 * docs/game-period.md. "Order of opening" is presentation order, not a gate.
 */
export const listOpenTasks = (completedThisPeriod: readonly string[]) => {
  const done = new Set(completedThisPeriod);
  return listTasks().filter((task) => !done.has(task.id));
};

/**
 * Next task to put on the HUD: the first open one in catalogue order, or null
 * when every task of the period is done.
 */
export const nextTaskId = (
  completedThisPeriod: readonly string[],
): string | null => listOpenTasks(completedThisPeriod)[0]?.id ?? null;

/**
 * Whether a task may be started or completed right now.
 *
 * Always true for known incomplete tasks — no progressive unlock in the
 * mandatory scenario.
 */
export const isTaskAvailable = (
  taskId: string,
  completedThisPeriod: readonly string[],
): boolean => listOpenTasks(completedThisPeriod).some((t) => t.id === taskId);
