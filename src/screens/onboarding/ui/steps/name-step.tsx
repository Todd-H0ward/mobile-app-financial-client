import { StyleSheet, View } from 'react-native';

import {
  normalizePlayerName,
  PLAYER_NAME_MAX_LENGTH,
  validatePlayerName,
} from '@/entities/user';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { Input, Text } from '@/shared/ui';

import type { OnboardingController } from '../../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface NameStepProps {
  onboarding: OnboardingController;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** What the sign says before anything is typed. */
const EMPTY_SIGN = 'Дом ?';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The game name — one of the two free-text fields in the whole app, and never
 * called a real name anywhere (docs/privacy.md).
 *
 * It is a sign over a door rather than a registration form: what is typed shows
 * up on the sign as it is typed, so the field reads as part of the game.
 */
export const NameStep = ({ onboarding }: NameStepProps) => {
  const theme = useTheme();
  const { playerName, setPlayerName } = onboarding;

  const sign = normalizePlayerName(playerName);
  const isEmpty = validatePlayerName(playerName) === 'empty';

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.sign,
          { backgroundColor: theme.surfaceSoft, borderColor: theme.accent },
        ]}
      >
        <Text variant="subtitle" numberOfLines={1}>
          {isEmpty ? EMPTY_SIGN : `Дом ${sign}`}
        </Text>
      </View>

      <Input
        value={playerName}
        onChangeText={setPlayerName}
        placeholder="Игровое имя"
        maxLength={PLAYER_NAME_MAX_LENGTH}
        isCounterVisible
        hint={
          isEmpty
            ? 'Напиши любое имя — его увидишь только ты'
            : 'Имя можно будет поменять в разделе для взрослых'
        }
      />
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.three,
  },
  sign: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: RADII.l,
    borderWidth: 2,
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.three,
  },
});

export type { NameStepProps };
