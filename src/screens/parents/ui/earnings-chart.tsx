import { StyleSheet, View } from 'react-native';

import type { PeriodEarnings } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface EarningsChartProps {
  rows: PeriodEarnings[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const MAX_POINTS = 6;
const CHART_HEIGHT = 88;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** In/out columns, not a net — same net can mean opposite stories; never red. */
export const EarningsChart = ({ rows }: EarningsChartProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const shown = rows.slice(-MAX_POINTS);
  const ceiling = Math.max(
    1,
    ...shown.map((row) => Math.max(row.earned, row.spent)),
  );
  const heightOf = (value: number) =>
    Math.max(2, Math.round((value / ceiling) * CHART_HEIGHT));

  return (
    <View style={styles.root}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={shown
          .map((row) =>
            t('parents.report.periodA11y', {
              period: row.periodIndex,
              earned: formatMoney(row.earned),
              spent: formatMoney(row.spent),
            }),
          )
          .join('. ')}
        style={styles.chart}
      >
        {shown.map((row) => (
          <View key={row.periodIndex} style={styles.group}>
            <View style={styles.pair}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: theme.phosphor,
                    borderColor: theme.phosphor,
                    height: heightOf(row.earned),
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    borderColor: theme.phosphor,
                    height: heightOf(row.spent),
                  },
                ]}
              />
            </View>
            <Text variant="code" themeColor="textMuted" style={styles.label}>
              {String(row.periodIndex)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: theme.phosphor, borderColor: theme.phosphor },
            ]}
          />
          <Text variant="small" themeColor="textSecondary">
            {t('parents.report.earned').toLocaleLowerCase()}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { borderColor: theme.phosphor }]} />
          <Text variant="small" themeColor="textSecondary">
            {t('parents.report.spent').toLocaleLowerCase()}
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
  bar: { borderWidth: 2, flex: 1, maxWidth: 36 },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    minHeight: CHART_HEIGHT + 20,
  },
  group: { alignItems: 'center', flex: 1, gap: SPACING.ONE },
  label: { fontSize: 12, lineHeight: 16 },
  legend: { flexDirection: 'row', gap: SPACING.THREE },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: SPACING.ONE },
  pair: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: SPACING.ONE,
    justifyContent: 'center',
    width: '100%',
  },
  root: { gap: SPACING.TWO },
  swatch: { borderWidth: 2, height: 12, width: 12 },
});

export type { EarningsChartProps };
