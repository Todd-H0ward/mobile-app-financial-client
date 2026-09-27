import { StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { BudgetComparison } from '@/entities/budget';
import { isOnPlan } from '@/entities/budget';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { PixelIcon, Text } from '@/shared/ui';
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

  const title = t(`boxes.${row.direction}`);
  const deltaLabel = onPlan
    ? t('periodSummary.onPlan')
    : row.delta > 0
      ? t('periodSummary.over', { count: formatMoney(row.delta) })
      : t('periodSummary.under', { count: formatMoney(Math.abs(row.delta)) });

  const bar = (value: number, fill: string) => (
    <View style={[styles.track, { backgroundColor: theme.surfaceSoft }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: fill, width: barWidth(value, barMax) },
        ]}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      accessibilityLabel={`${title}. ${t('periodSummary.plan')}: ${row.planned}. ${t('periodSummary.fact')}: ${row.actual}. ${deltaLabel}`}
    >
      <View style={styles.header}>
        <PixelIcon name={look.icon} />
        <Text variant="bodyBold" style={styles.title}>
          {title}
        </Text>
        {onPlan ? (
          <View style={styles.delta}>
            <PixelIcon name="check" size={12} />
            <Text variant="machine" style={styles.deltaText}>
              {deltaLabel}
            </Text>
          </View>
        ) : (
          <Text variant="code" themeColor="warning" style={styles.deltaText}>
            {`! ${deltaLabel}`}
          </Text>
        )}
      </View>

      <View style={styles.bars}>
        <View style={styles.barRow}>
          <Text variant="small" themeColor="textMuted" style={styles.barLabel}>
            {t('periodSummary.plan')}
          </Text>
          {bar(row.planned, theme.borderStrong)}
          <Text variant="code" style={styles.amount}>
            {formatMoney(row.planned)}
          </Text>
        </View>

        <View style={styles.barRow}>
          <Text variant="small" themeColor="textMuted" style={styles.barLabel}>
            {t('periodSummary.fact')}
          </Text>
          {bar(row.actual, theme.phosphor)}
          <Text variant="code" style={styles.amount}>
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
    fontFamily: FONTS.monoStrong,
    minWidth: 32,
    textAlign: 'right',
  },
  barLabel: {
    minWidth: 44,
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
    borderRadius: RADII.xs,
    height: '100%',
  },
  delta: { alignItems: 'center', flexDirection: 'row', gap: SPACING.one },
  deltaText: { fontFamily: FONTS.monoStrong, fontSize: 13, lineHeight: 18 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
  },
  root: {
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.two,
    padding: SPACING.compact,
  },
  title: {
    flex: 1,
  },
  track: {
    borderRadius: RADII.xs,
    flex: 1,
    height: 10,
    overflow: 'hidden',
  },
});

export type { ComparisonRowProps };
