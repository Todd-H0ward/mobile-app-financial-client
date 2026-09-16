import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';
import { PetBox } from '@/widgets/pet-box';

import { DemoModeCard } from '@/features/demo-mode';
import { RestartOnboardingButton } from '@/features/profile-restart';

import { appearanceFor, emotionFor, moodFor } from '@/entities/pet';
import { PetView } from '@/entities/pet/ui';
import { useUserStore } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { Button, Card, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Side of the pet in the room. */
const PET_SIZE = 200;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HomeScreen = () => {
  const router = useRouter();
  const pet = useUserStore((state) => state.user?.pet);
  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );

  const isPetMet = (pet?.name ?? '') !== '';

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header
        title="Лапка"
        subtitle={
          isPetMet
            ? `Дома: ${pet?.name}`
            : 'Комната питомца появится в первой волне'
        }
        trailing={<HintButton screen="home" />}
      />

      {isPetMet && pet != null ? (
        <View style={styles.stage}>
          <PetView
            appearance={appearanceFor(pet.species, pet.color, pet.pattern)}
            emotion={emotionFor(moodFor(pet.comfort, pet.spirit))}
            stage={pet.stage}
            size={PET_SIZE}
            isAnimated={isAnimationEnabled}
            accessibilityLabel={`${pet.name}, ${moodFor(pet.comfort, pet.spirit).name}`}
          />
        </View>
      ) : (
        <PetBox onPress={() => router.push('/pet-create')} />
      )}

      <Card tone="surfaceSoft">
        <Card.Title>Разработка</Card.Title>
        <Card.Content>
          <Text themeColor="textSecondary">
            Витрина дизайн-системы: все компоненты и их состояния на одном
            экране. Вторая кнопка удаляет профиль и открывает знакомство заново
            — она же переедет в раздел для взрослых (2.5.12).
          </Text>
        </Card.Content>
        <Card.Footer>
          <View style={styles.actions}>
            <Button size="m" isFullWidth onPress={() => router.push('/ui-kit')}>
              Открыть UI-кит
            </Button>

            <RestartOnboardingButton />
          </View>
        </Card.Footer>
      </Card>

      <DemoModeCard />
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.two,
    width: '100%',
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
