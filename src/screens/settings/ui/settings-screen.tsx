import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useChangeLanguage } from '@/features/change-language';
import { DemoModeCard } from '@/features/demo-mode';
import { RestartOnboardingButton } from '@/features/profile-restart';

import { useUserStore } from '@/entities/user';

import { ROUTES, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import type { LanguagePreference } from '@/shared/types';
import { Button, Card, ListRow, Screen, Switch, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const LANGUAGE_OPTIONS: { value: LanguagePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.system' },
  { value: 'ru', labelKey: 'settings.russian' },
  { value: 'en', labelKey: 'settings.english' },
];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SettingsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
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
          <Screen.Title>{t('settings.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.language')}</Card.Title>
        <Card.Content>
          <View style={styles.langButtons}>
            {LANGUAGE_OPTIONS.map(({ value, labelKey }) => (
              <Button
                key={value}
                size="m"
                variant={languagePreference === value ? 'primary' : 'secondary'}
                isFullWidth
                onPress={() => changeLanguage(value)}
              >
                {t(labelKey)}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.interface')}</Card.Title>
        <Card.Content style={styles.toggles}>
          <ListRow
            title={t('settings.animations')}
            subtitle={t('settings.animationsSubtitle')}
            trailing={
              <Switch
                isChecked={isAnimationEnabled}
                onChange={setAnimation}
                label={t('settings.animations')}
              />
            }
          />
          <ListRow
            title={t('settings.sound')}
            subtitle={t('settings.soundSubtitle')}
            trailing={
              <Switch
                isChecked={isSoundEnabled}
                onChange={setSound}
                label={t('settings.sound')}
              />
            }
          />
        </Card.Content>
      </Card>

      <DemoModeCard />

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.development')}</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.uiKitDescription')}
          </Text>
        </Card.Content>
        <Card.Footer>
          <Button
            size="m"
            isFullWidth
            onPress={() => router.push(ROUTES.UI_KIT)}
          >
            {t('settings.openUiKit')}
          </Button>
        </Card.Footer>
      </Card>

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.profile')}</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.profileDescription')}
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
