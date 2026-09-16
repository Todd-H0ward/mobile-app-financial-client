import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';
import { PetBox } from '@/widgets/pet-box';

import { PetView } from '@/entities/pet/ui';

import { RADII, ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Screen, SettingsIcon } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

import { useHomeHud } from '../model';

import { HomeHud } from './home-hud';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Side of the pet in the room. */
const PET_SIZE = 200;

/** Visual size of the settings button; hitSlop expands it to 48dp. */
const GEAR_SIZE = 40;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const GearButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.settingsA11y')}
      hitSlop={hitSlopFor(GEAR_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.gear,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <SettingsIcon color={theme.textSecondary} />
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The room screen: the pet plus everything requirement 2.5.3 asks to sit next
 * to it at once — balance, savings, the active goal, the pet's state and the
 * task slot. `useHomeHud` reads the save once and hands back that whole
 * picture as one object; this component only lays it out.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const hud = useHomeHud();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>{t('home.title')}</Screen.Title>
          <Screen.Subtitle>{hud.subtitle}</Screen.Subtitle>
        </Screen.Heading>

        <View style={styles.headerActions}>
          <GearButton onPress={() => router.push(ROUTES.SETTINGS)} />
          <HintButton screen="home" />
        </View>
      </Screen.Header>

      {hud.pet ? (
        <View style={styles.stage}>
          <PetView
            appearance={hud.pet.appearance}
            emotion={hud.pet.emotion}
            stage={hud.pet.stage}
            size={PET_SIZE}
            isAnimated={hud.isAnimationEnabled}
            accessibilityLabel={hud.pet.accessibilityLabel}
          />
        </View>
      ) : (
        <PetBox onPress={() => router.push(ROUTES.PET_CREATE)} />
      )}

      <HomeHud
        moodLabel={hud.pet?.moodLabel}
        moodTone={hud.pet?.moodTone}
        balance={hud.balance}
        savingsTotal={hud.savingsTotal}
        goal={hud.goal}
        lastCredit={hud.lastCredit}
        taskHint={hud.taskHint}
      />
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  gear: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 1,
    height: GEAR_SIZE,
    justifyContent: 'center',
    width: GEAR_SIZE,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
