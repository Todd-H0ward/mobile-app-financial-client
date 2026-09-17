import { HEATING } from '@/entities/economy';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** One printable line on the period heating bill — docs/house.md. */
interface HeatingBillLine {
  /** Stable key for i18n (`home.bill.*`). */
  key: 'base' | 'aboveBase' | 'insulation';
  /** Degrees (tenths) or insulation count — for copy interpolation. */
  count: number;
  /** Signed coins: positive charge, negative discount. */
  amount: number;
}

interface HeatingBill {
  /** Thermostat 0…1 that produced the bill. */
  temperature: number;
  /** Lines that sum to `total`. */
  lines: HeatingBillLine[];
  /** Coins due this period, never below zero. */
  total: number;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Builds the heating bill for one period from thermostat + insulation.
 *
 * Pure: no wallet mutation. Settlement applies the total once via
 * `lastBilledPeriod` — docs/house.md / 0.3-R.
 */
export const buildBill = (
  temperature: number,
  insulationIds: readonly string[],
): HeatingBill => {
  const temp = Number.isFinite(temperature) ? temperature : 0;
  const tenthsAbove = Math.max(
    0,
    Math.round((temp - HEATING.freeTemperature) * 10),
  );
  const aboveAmount = tenthsAbove * HEATING.coinsPerTenth;
  const insulationCount = insulationIds.length;
  const insulationAmount = Math.min(
    aboveAmount,
    insulationCount * HEATING.insulationDiscount,
  );

  const lines: HeatingBillLine[] = [{ key: 'base', count: 0, amount: 0 }];

  if (tenthsAbove > 0) {
    lines.push({
      key: 'aboveBase',
      count: tenthsAbove,
      amount: aboveAmount,
    });
  }
  if (insulationAmount > 0) {
    lines.push({
      key: 'insulation',
      count: insulationCount,
      amount: -insulationAmount,
    });
  }

  return {
    temperature: temp,
    lines,
    total: Math.max(0, aboveAmount - insulationAmount),
  };
};

export type { HeatingBill, HeatingBillLine };
