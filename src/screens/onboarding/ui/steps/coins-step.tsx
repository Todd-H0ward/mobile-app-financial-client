import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { STARTING_BALANCE } from '@/entities/economy';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { CoinBadge, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COIN_COUNT = 6;
const COIN_SIZE = 26;
const COIN_DELAY = 90;
const COIN_DURATION = 320;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const CoinsStep = () => {
  const theme = useTheme();
  const coins = Array.from({ length: COIN_COUNT }, (_, index) => index);

  return (
    <View style={styles.root}>
      <View
        accessibilityRole="image"
        accessibilityLabel={`${STARTING_BALANCE} монет падают в кошелёк`}
        style={styles.shower}
      >
        {coins.map((index) => (
          <Animated.View
            key={index}
            entering={ZoomIn.delay(index * COIN_DELAY).duration(COIN_DURATION)}
            style={[
              styles.coin,
              { backgroundColor: theme.coin, borderColor: theme.coinBorder },
            ]}
          />
        ))}
      </View>

      <CoinBadge
        amount={STARTING_BALANCE}
        label="стартовые монеты"
        style={styles.badge}
      />

      <Text variant="small" themeColor="textSecondary" style={styles.caption}>
        Рядом с монетами всегда написано, откуда они пришли. Дальше их будут
        приносить задания.
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: SPACING.three,
  },
  badge: {
    alignSelf: 'center',
  },
  caption: {
    textAlign: 'center',
  },
  coin: {
    borderRadius: RADII.pill,
    borderWidth: 2,
    height: COIN_SIZE,
    width: COIN_SIZE,
  },
  shower: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
    justifyContent: 'center',
  },
});
