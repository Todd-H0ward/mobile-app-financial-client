import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { DemoModeCard } from '@/features/demo-mode';
import { RestartOnboardingButton } from '@/features/profile-restart';

import { SPACING } from '@/shared/constants';
import { Button, Card, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const HomeScreen = () => {
  const router = useRouter();

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header
        title="Лапка"
        subtitle="Комната питомца появится в первой волне"
        trailing={<HintButton screen="home" />}
      />

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
});
