import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useChangeLanguage } from '@/features/change-language';
import { DemoModeCard } from '@/features/demo-mode';
import { RestartOnboardingButton } from '@/features/profile-restart';

import { useUserStore } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import type { LanguagePreference } from '@/shared/types';
import { Button, Card, ListRow, Screen, Switch, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'system', label: 'Системный' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SettingsScreen = () => {
  const router = useRouter();
  const { languagePreference, changeLanguage } = useChangeLanguage();
  const updateUser = useUserStore((state) => state.updateUser);

  const isAnimationEnabled = useUserStore(
    (state) => state.user?.settings.isAnimationEnabled ?? true,
  );
  const isSoundEnabled = useUserStore(
    (state) => state.user?.settings.isSoundEnabled ?? true,
  );

  const setAnimation = (isEnabled: boolean) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, isAnimationEnabled: isEnabled },
    }));

  const setSound = (isEnabled: boolean) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, isSoundEnabled: isEnabled },
    }));

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>Настройки</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Title>Язык</Card.Title>
        <Card.Content>
          <View style={styles.langButtons}>
            {LANGUAGE_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                size="m"
                variant={languagePreference === value ? 'primary' : 'secondary'}
                isFullWidth
                onPress={() => changeLanguage(value)}
              >
                {label}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Title>Интерфейс</Card.Title>
        <Card.Content style={styles.toggles}>
          <ListRow
            title="Анимации"
            subtitle="Плавные переходы и движение питомца"
            trailing={
              <Switch
                isChecked={isAnimationEnabled}
                onChange={setAnimation}
                label="Анимации"
              />
            }
          />
          <ListRow
            title="Звук"
            subtitle="Звуковые эффекты"
            trailing={
              <Switch
                isChecked={isSoundEnabled}
                onChange={setSound}
                label="Звук"
              />
            }
          />
        </Card.Content>
      </Card>

      <DemoModeCard />

      <Card tone="surfaceSoft">
        <Card.Title>Разработка</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            Витрина дизайн-системы: все компоненты и их состояния на одном
            экране.
          </Text>
        </Card.Content>
        <Card.Footer>
          <Button size="m" isFullWidth onPress={() => router.push('/ui-kit')}>
            Открыть UI-кит
          </Button>
        </Card.Footer>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Title>Профиль</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            Удаляет профиль и открывает знакомство заново. Монеты, копилка и
            история периодов пропадут безвозвратно.
          </Text>
        </Card.Content>
        <Card.Footer>
          <RestartOnboardingButton />
        </Card.Footer>
      </Card>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  langButtons: {
    gap: SPACING.two,
  },
  toggles: {
    gap: SPACING.two,
  },
});
