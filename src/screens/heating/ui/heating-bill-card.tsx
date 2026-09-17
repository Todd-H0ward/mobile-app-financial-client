import { StyleSheet, View } from 'react-native';

import type { HeatingBill } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HeatingBillCardProps {
  bill: HeatingBill;
  /** Period index for the receipt title. */
  periodIndex: number;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Line-by-line heating receipt — docs/house.md.
 *
 * One total alone would hide which decision made the number; every charge and
 * discount stays its own row.
 */
export const HeatingBillCard = ({
  bill,
  periodIndex,
}: HeatingBillCardProps) => {
  const { t } = useTranslation();

  return (
    <Card tone="surfaceSoft">
      <Card.Content>
        <Text variant="bodyBold">
          {t('heating.billTitle', { period: periodIndex })}
        </Text>
        <View style={styles.lines}>
          {bill.lines.map((line) => (
            <View key={line.key} style={styles.row}>
              <Text themeColor="textSecondary" style={styles.rowLabel}>
                {t(`heating.bill.${line.key}`, { count: line.count })}
              </Text>
              <Text variant="smallBold">
                {line.amount < 0
                  ? `−${formatMoney(-line.amount)}`
                  : formatMoney(line.amount)}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.row, styles.total]}>
          <Text variant="bodyBold">{t('heating.billTotal')}</Text>
          <Text variant="bodyBold">{formatMoney(bill.total)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  lines: {
    gap: SPACING.half,
    marginTop: SPACING.two,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'space-between',
  },
  rowLabel: {
    flex: 1,
  },
  total: {
    marginTop: SPACING.two,
    paddingTop: SPACING.two,
  },
});

export type { HeatingBillCardProps };
