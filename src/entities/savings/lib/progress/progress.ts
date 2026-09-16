import { clamp } from '@/shared/utils';

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * How full the jar is for one goal — 0…1, never above full.
 *
 * Formula from docs/economy.md: `saved / price`, clamped.
 */
export const progressFor = (saved: number, price: number): number => {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return clamp(saved / price, 0, 1);
};

/** Coins still needed to reach the goal. Never below zero. */
export const remainingFor = (saved: number, price: number): number =>
  Math.max(0, price - Math.max(0, saved));

/**
 * Rough periods left if the child keeps putting aside `perPeriod` each time.
 * `null` when there is no planned deposit to divide by.
 */
export const periodsEstimateFor = (
  remaining: number,
  perPeriod: number,
): number | null => {
  if (!Number.isFinite(remaining) || remaining <= 0) return 0;
  if (!Number.isFinite(perPeriod) || perPeriod <= 0) return null;
  return Math.ceil(remaining / perPeriod);
};
