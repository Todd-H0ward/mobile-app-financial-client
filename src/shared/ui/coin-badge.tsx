import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { FONTS, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { formatMoney } from '../utils';

import { Coin } from './coin';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type CoinBadgeVariant = 'balance' | 'delta' | 'plain';

interface CoinBadgeProps {
  amount: number | string;
  variant?: CoinBadgeVariant;
  label?: string;
  coinSize?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/** A delta may arrive pre-signed as a string ("-15"), so check both shapes. */
const isNegative = (amount: number | string) =>
  typeof amount === 'number' ? amount < 0 : amount.trimStart().startsWith('-');

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const CoinBadge = ({
  amount,
  variant = 'balance',
  label,
  coinSize = 24,
  style,
}: CoinBadgeProps) => {
  const theme = useTheme();
  const isDelta = variant === 'delta';

  // Gains and spends keep their sign; spending uses quiet text, never a warning.
  const isLoss = isDelta && isNegative(amount);
  const deltaSurface = theme.surfaceDeep;
  const deltaText = isLoss ? 'textSecondary' : 'primary';

  return (
    <View
      style={[
        styles.root,
        variant !== 'plain' && {
          backgroundColor: isDelta ? deltaSurface : theme.surface,
          borderColor: theme.borderStrong,
          borderWidth: 2,
        },
        style,
      ]}
    >
      <Text
        variant="subtitle"
        themeColor={isDelta ? deltaText : 'text'}
        style={styles.amount}
      >
        {typeof amount === 'number'
          ? `${isDelta && amount > 0 ? '+' : ''}${formatMoney(amount)}`
          : amount}
      </Text>

      <Coin size={coinSize} />

      {label != null && (
        <Text variant="small" themeColor="textMuted">
          {label}
        </Text>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    flexDirection: 'row',
    gap: SPACING.two,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.one,
  },
  amount: {
    fontFamily: FONTS.monoStrong,
  },
});

export type { CoinBadgeProps, CoinBadgeVariant };
