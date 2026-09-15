import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADII } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { formatMoney } from '../utils';

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
// LIB
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
  coinSize = 22,
  style,
}: CoinBadgeProps) => {
  const theme = useTheme();
  const isDelta = variant === 'delta';

  // A spend must not borrow the green of a gain. The warm accent reads as
  // "went out" without alarming a child the way a red would.
  const isLoss = isDelta && isNegative(amount);
  const deltaSurface = isLoss ? theme.accentSoft : theme.successSoft;
  const deltaText = isLoss ? 'accentStrong' : 'successStrong';

  return (
    <View
      style={[
        styles.root,
        variant !== 'plain' && {
          backgroundColor: isDelta ? deltaSurface : theme.surface,
          borderColor: isDelta ? 'transparent' : theme.coinSoft,
          borderWidth: isDelta ? 0 : 1.5,
        },
        style,
      ]}
    >
      {!isDelta && (
        <View
          style={[
            styles.coin,
            {
              backgroundColor: theme.coin,
              borderColor: theme.coinBorder,
              borderRadius: coinSize / 2,
              height: coinSize,
              width: coinSize,
            },
          ]}
        />
      )}

      <Text
        variant="subtitle"
        themeColor={isDelta ? deltaText : 'text'}
        style={styles.amount}
      >
        {typeof amount === 'number'
          ? `${isDelta && amount > 0 ? '+' : ''}${formatMoney(amount)}`
          : amount}
      </Text>

      {label != null && (
        <Text variant="label" themeColor="textMuted">
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
    borderRadius: RADII.pill,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  coin: {
    borderWidth: 2,
  },
  amount: {
    fontWeight: 900,
  },
});

export type { CoinBadgeProps, CoinBadgeVariant };
