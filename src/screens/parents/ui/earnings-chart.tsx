import type { PeriodEarnings } from '@/entities/user';

import { useTranslation } from '@/shared/i18n';
import { LineChart } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface EarningsChartProps {
  /** Oldest period first — the chart reads left to right like a calendar. */
  rows: PeriodEarnings[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** How many periods fit before the chart starts dropping the oldest. */
const MAX_POINTS = 8;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Coins in and out over the periods, as two lines.
 *
 * Two series rather than one net number: "earned 40, spent 35" and "earned 5,
 * spent 0" net out the same and mean nothing alike. Spending is drawn in the
 * warm accent and never in red — docs/budget.md keeps money out of alarm
 * colours, and the gap between the lines is the thing worth reading.
 */
export const EarningsChart = ({ rows }: EarningsChartProps) => {
  const { t } = useTranslation();

  const shown = rows.slice(-MAX_POINTS);

  return (
    <LineChart
      series={[
        {
          values: shown.map((row) => row.earned),
          color: 'success',
          label: t('parents.report.earned'),
        },
        {
          values: shown.map((row) => row.spent),
          color: 'accent',
          label: t('parents.report.spent'),
        },
      ]}
      labels={shown.map((row) => String(row.periodIndex))}
      accessibilityLabel={shown
        .map((row) =>
          t('parents.report.periodA11y', {
            period: row.periodIndex,
            earned: formatMoney(row.earned),
            spent: formatMoney(row.spent),
          }),
        )
        .join('. ')}
    />
  );
};

export type { EarningsChartProps };
