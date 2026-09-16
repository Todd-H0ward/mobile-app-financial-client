import { useCallback, useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { listDecisions } from '@/entities/onboarding';
import { appearanceFor, emotionFor, moodFor } from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { RADII, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, Text } from '@/shared/ui';

import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface GreetingStepProps {
  hasMetPet: boolean;
  onBoop: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PET_SIZE = 168;
const SPRING = { damping: 14, stiffness: 220 };

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * First meeting: a real pet to boop, three colourful boxes as scenery, and a
 * short privacy line — not a product walkthrough.
 */
export const GreetingStep = ({ hasMetPet, onBoop }: GreetingStepProps) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const [isHappy, setIsHappy] = useState(false);

  const appearance = appearanceFor('cat', 'sand', 'solid');
  const mood = moodFor(1, isHappy || hasMetPet ? 1 : 0.55);
  const emotion = isHappy || hasMetPet ? 'happy' : emotionFor(mood);

  const petStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleBoop = useCallback(() => {
    scale.value = withSpring(1.08, SPRING, () => {
      scale.value = withSpring(1, SPRING);
    });
    setIsHappy(true);
    onBoop();
  }, [onBoop, scale]);

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.boopA11y')}
        onPress={handleBoop}
        style={styles.stage}
      >
        <Animated.View entering={FadeIn.duration(280)}>
          <Animated.View style={petStyle}>
            <PetView
              appearance={appearance}
              emotion={emotion}
              stage="baby"
              size={PET_SIZE}
              isAnimated
              accessibilityLabel={t('onboarding.boopA11y')}
            />
          </Animated.View>
        </Animated.View>
        {!hasMetPet && (
          <Text variant="small" themeColor="primaryStrong" style={styles.hint}>
            {t('onboarding.boopHint')}
          </Text>
        )}
      </Pressable>

      <View style={styles.boxes}>
        {listDecisions().map((decision) => (
          <DecisionBasket
            key={decision.id}
            direction={decision.id}
            title={decision.title}
            example={decision.example}
          />
        ))}
      </View>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('onboarding.privacyNote')}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    gap: SPACING.two,
  },
  hint: {
    textAlign: 'center',
  },
  root: {
    gap: SPACING.three,
  },
  stage: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: RADII.xl,
    gap: SPACING.two,
    paddingVertical: SPACING.two,
  },
});

export type { GreetingStepProps };
