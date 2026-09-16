import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';
import { PetBox } from '@/widgets/pet-box';

import { appearanceFor, emotionFor, moodFor } from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';
import { useUserStore } from '@/entities/user';

import { RADII, ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Screen, SettingsIcon } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

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

export const HomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const pet = useUserStore((state) => state.user?.pet);
  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );

  const isPetMet = (pet?.name ?? '') !== '';

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>{t('home.title')}</Screen.Title>
          <Screen.Subtitle>
            {isPetMet
              ? t('home.atHome', { name: pet?.name })
              : t('home.roomComingSoon')}
          </Screen.Subtitle>
        </Screen.Heading>

        <View style={styles.headerActions}>
          <GearButton onPress={() => router.push(ROUTES.SETTINGS)} />
          <HintButton screen="home" />
        </View>
      </Screen.Header>

      {isPetMet && pet != null ? (
        <View style={styles.stage}>
          <PetView
            appearance={appearanceFor(pet.species, pet.color, pet.pattern)}
            emotion={emotionFor(moodFor(pet.comfort, pet.spirit))}
            stage={pet.stage}
            size={PET_SIZE}
            isAnimated={isAnimationEnabled}
            accessibilityLabel={`${pet.name}, ${t(`pet.mood.${moodFor(pet.comfort, pet.spirit).name}`)}`}
          />
        </View>
      ) : (
        <PetBox onPress={() => router.push(ROUTES.PET_CREATE)} />
      )}
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
