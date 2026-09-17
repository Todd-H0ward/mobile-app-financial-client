import { StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { BudgetComparison } from '@/entities/budget';
import { isOnPlan } from '@/entities/budget';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ComparisonRowProps {
  row: BudgetComparison;
  /** Shared ceiling so the three bars read against one scale. */
  barMax: number;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const barWidth = (value: number, max: number) =>
  `${Math.round((Math.max(0, value) / max) * 100)}%` as const;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One direction: plan bar, fact bar, and a signed delta in words — never red.
 */
export const ComparisonRow = ({ row, barMax }: ComparisonRowProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const look = DIRECTION_LOOK[row.direction];
  const onPlan = isOnPlan(row);

  const title = t(`budgetPlan.directions.${row.direction}.title`);
  const deltaLabel = onPlan
    ? t('periodSummary.onPlan')
    : row.delta > 0
      ? t('periodSummary.over', { count: formatMoney(row.delta) })
      : t('periodSummary.under', { count: formatMoney(Math.abs(row.delta)) });

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme[look.surface],
          borderColor: theme[look.accent],
        },
      ]}
      accessibilityLabel={`${title}. ${t('periodSummary.plan')}: ${row.planned}. ${t('periodSummary.fact')}: ${row.actual}. ${deltaLabel}`}
    >
      <View style={styles.header}>
        <Shape variant={look.marker} size={18} color={theme[look.accent]} />
        <Text variant="bodyBold" themeColor={look.label} style={styles.title}>
          {title}
        </Text>
        <Text variant="small" themeColor="textSecondary">
          {deltaLabel}
        </Text>
      </View>

      <View style={styles.bars}>
        <View style={styles.barRow}>
          <Text variant="label" themeColor="textMuted" style={styles.barLabel}>
            {t('periodSummary.plan')}
          </Text>
          <View style={[styles.track, { backgroundColor: theme.surface }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: theme[look.accent],
                  opacity: 0.45,
                  width: barWidth(row.planned, barMax),
                },
              ]}
            />
          </View>
          <Text variant="smallBold" style={styles.amount}>
            {formatMoney(row.planned)}
          </Text>
        </View>

        <View style={styles.barRow}>
          <Text variant="label" themeColor="textMuted" style={styles.barLabel}>
            {t('periodSummary.fact')}
          </Text>
          <View style={[styles.track, { backgroundColor: theme.surface }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: theme[look.accent],
                  width: barWidth(row.actual, barMax),
                },
              ]}
            />
          </View>
          <Text variant="smallBold" style={styles.amount}>
            {formatMoney(row.actual)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  amount: {
    minWidth: 36,
    textAlign: 'right',
  },
  barLabel: {
    minWidth: 40,
  },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  bars: {
    gap: SPACING.one,
  },
  fill: {
    borderRadius: RADII.pill,
    height: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  root: {
    borderRadius: RADII.l,
    borderWidth: 1.5,
    gap: SPACING.two,
    padding: SPACING.three,
  },
  title: {
    flex: 1,
  },
  track: {
    borderRadius: RADII.pill,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
});

export type { ComparisonRowProps };
