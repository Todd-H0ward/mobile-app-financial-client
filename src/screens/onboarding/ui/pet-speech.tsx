import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  appearanceFor,
  type PetColor,
  type PetPattern,
  type PetSpecies,
} from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetSpeechProps {
  /** What the pet says on this step. Comes from the content file. */
  line: string;
  /** Changing it replays the entrance, so a new line is noticed. */
  stepId: string;
  species?: PetSpecies;
  color?: PetColor;
  pattern?: PetPattern;
  /** Smaller pet next to the bubble — for steps that already show a big pet. */
  isCompact?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PET_SIZE = 72;
const PET_SIZE_COMPACT = 48;
const ENTRANCE_DURATION = 260;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const PetSpeech = ({
  line,
  stepId,
  species = 'cat',
  color = 'sand',
  pattern = 'solid',
  isCompact = false,
}: PetSpeechProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const appearance = appearanceFor(species, color, pattern);
  const size = isCompact ? PET_SIZE_COMPACT : PET_SIZE;

  return (
    <View style={styles.root}>
      <PetView
        appearance={appearance}
        emotion="calm"
        stage="baby"
        size={size}
        isAnimated={!isCompact}
        accessibilityLabel={t('onboarding.petPreviewA11y')}
      />

      <Animated.View
        key={stepId}
        entering={FadeInDown.duration(ENTRANCE_DURATION)}
        style={[styles.bubble, { backgroundColor: theme.surface }]}
      >
        <Text>{line}</Text>
      </Animated.View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  bubble: {
    borderRadius: RADII.l,
    flex: 1,
    padding: SPACING.three,
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { PetSpeechProps };
