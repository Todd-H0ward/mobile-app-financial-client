import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { labelWalletSource, type WalletHistoryRow } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape, type ShapeVariant, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WalletHistoryRowViewProps {
  row: WalletHistoryRow;
  /** Draws the hairline above — every row but the first. */
  isDivided?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The box a spend came out of, as a shape — colour is never the only sign. */
const DIRECTION_SHAPE: Record<string, ShapeVariant> = {
  needs: 'circle',
  wants: 'diamond',
  savings: 'square',
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** UI kit 07 "строка истории": a coin always has a source. */
export const WalletHistoryRowView = memo(
  ({ row, isDivided = false }: WalletHistoryRowViewProps) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isEarn = row.entry.kind === 'earn';
    const shape = row.entry.direction
      ? DIRECTION_SHAPE[row.entry.direction]
      : undefined;
    const source = labelWalletSource(row.source, t);
    // Source labels are written mid-sentence; a row starts one.
    const title = source.charAt(0).toLocaleUpperCase() + source.slice(1);
    const amount = `${isEarn ? '+' : '−'}${formatMoney(row.entry.amount)}`;

    return (
      <View
        accessible
        accessibilityLabel={`${title}, ${amount}`}
        style={[
          styles.root,
          isDivided && [styles.divided, { borderColor: theme.border }],
        ]}
      >
        {!isEarn && shape ? (
          <Shape variant={shape} size={10} color={theme.textSecondary} />
        ) : null}
        <View style={styles.copy}>
          <Text>{title}</Text>
          <Text variant="code" themeColor="textMuted" style={styles.meta}>
            {t('history.coinMeta', { period: row.entry.periodIndex })}
          </Text>
        </View>
        <Text
          variant={isEarn ? 'machine' : 'code'}
          themeColor={isEarn ? 'phosphor' : 'textSecondary'}
          style={styles.amount}
        >
          {amount}
        </Text>
      </View>
    );
  },
);

WalletHistoryRowView.displayName = 'WalletHistoryRowView';

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  amount: { fontSize: 16, lineHeight: 22 },
  copy: { flex: 1, minWidth: 0 },
  divided: { borderTopWidth: 1 },
  meta: { fontSize: 12, lineHeight: 16 },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.compact,
    paddingVertical: 10,
  },
});

export type { WalletHistoryRowViewProps };
