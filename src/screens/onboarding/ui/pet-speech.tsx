import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Shape, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PetSpeechProps {
  /** What the pet says on this step. Comes from the content file. */
  line: string;
  /** Changing it replays the entrance, so a new line is noticed. */
  stepId: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PET_SIZE = 64;
const ENTRANCE_DURATION = 260;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const PetSpeech = ({ line, stepId }: PetSpeechProps) => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <Shape variant="dome" size={PET_SIZE} color={theme.primarySoft} />

      <Animated.View
        // Keyed by step, so the bubble re-enters with every new line.
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
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  bubble: {
    borderRadius: RADII.l,
    flex: 1,
    padding: SPACING.three,
  },
});

export type { PetSpeechProps };
