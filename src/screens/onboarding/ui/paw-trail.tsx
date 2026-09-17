import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Shape } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PawTrailProps {
  /** Step being walked, from 1. */
  current: number;
    total: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PAW_SIZE = 14;
const WALKED_PAW_SIZE = 18;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Progress as a trail of paw prints instead of a bar: the walk is short and a
 * child reads "three more paws" faster than a percentage.
 *
 * Walked steps keep their print — nothing here is ever taken back — and the
 * trail carries no time at all, because there are no timers in this app.
 */
export const PawTrail = ({ current, total }: PawTrailProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('onboarding.pawTrailA11y', { current, total })}
      accessibilityValue={{ now: current, min: 1, max: total }}
      style={styles.root}
    >
      {steps.map((step) => {
        const isWalked = step <= current;

        return (
          <Shape
            key={step}
            variant="leaf"
            size={step === current ? WALKED_PAW_SIZE : PAW_SIZE}
            color={isWalked ? theme.primary : theme.surfaceDeep}
            isOutlined={!isWalked}
          />
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { PawTrailProps };
