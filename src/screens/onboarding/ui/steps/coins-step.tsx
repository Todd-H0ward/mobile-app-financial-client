import { useState } from 'react';

import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { STARTING_BALANCE } from '@/entities/economy';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Coin, CoinBadge, ScratchCard, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface CoinsStepProps {
  onReveal: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COIN_COUNT = 5;
const COIN_SIZE = 28;
const COIN_DELAY = 70;
const COIN_DURATION = 280;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const CoinsStep = ({ onReveal }: CoinsStepProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const coins = Array.from({ length: COIN_COUNT }, (_, index) => index);

  return (
    <View style={styles.root}>
      <ScratchCard
        foilLabel={t('onboarding.scratchFoil')}
        onReveal={() => {
          setIsOpen(true);
          onReveal();
        }}
        style={styles.ticket}
      >
        <View
          accessibilityRole="image"
          accessibilityLabel={t('onboarding.starterCoinsA11y', {
            count: STARTING_BALANCE,
          })}
          style={styles.shower}
        >
          {coins.map((index) => (
            <Animated.View
              key={index}
              entering={
                isOpen
                  ? ZoomIn.delay(index * COIN_DELAY).duration(COIN_DURATION)
                  : undefined
              }
            >
              <Coin size={COIN_SIZE} isActive={isOpen} />
            </Animated.View>
          ))}
        </View>

        <CoinBadge
          amount={STARTING_BALANCE}
          label={t('onboarding.starterCoins')}
          style={styles.badge}
        />
      </ScratchCard>

      <Text variant="small" themeColor="textSecondary" style={styles.caption}>
        {isOpen
          ? t('onboarding.starterCoinsCaption')
          : t('onboarding.scratchHint')}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
  },
  caption: {
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    gap: SPACING.three,
  },
  shower: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.two,
    justifyContent: 'center',
  },
  ticket: {
    alignSelf: 'stretch',
  },
});

export type { CoinsStepProps };
