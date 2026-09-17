import { HEATING } from '@/entities/economy';

import { buildBill } from './build-bill';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/**
 * How many periods one more insulation needs to earn back its price —
 * docs/house.md. Computed at the *current* thermostat: with heat off there
 * is nothing to save, so the purchase is named as not worth it.
 */
type InsulationPayback =
  | {
      /** Heat is free (or already fully discounted) — nothing left to cut. */
      kind: 'never';
    }
  | {
      kind: 'periods';
      /** Coins this insulation would shave off each later bill. */
      savingPerPeriod: number;
      /** Price ÷ saving, never below 1 when there is a saving. */
      periods: number;
    };

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Payback for buying one more insulation id at the current thermostat.
 *
 * Uses the same `buildBill` settlement will, so the number on the shelf is
 * the one the simulation can confirm (economy.md).
 */
export const insulationPayback = (
  price: number,
  temperature: number,
  insulationIds: readonly string[],
): InsulationPayback => {
  const before = buildBill(temperature, insulationIds).total;
  // A placeholder id is enough: the bill only counts how many ids are held.
  const after = buildBill(temperature, [...insulationIds, '__next__']).total;
  const savingPerPeriod = before - after;

  if (savingPerPeriod <= 0 || price <= 0) {
    return { kind: 'never' };
  }

  return {
    kind: 'periods',
    savingPerPeriod,
    periods: Math.max(1, Math.ceil(price / savingPerPeriod)),
  };
};

/** Coins one insulation id shaves when the thermostat has room to save. */
export const insulationSavingHint = (): number => HEATING.insulationDiscount;

export type { InsulationPayback };
