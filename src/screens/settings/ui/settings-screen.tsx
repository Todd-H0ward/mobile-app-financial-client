import { useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RobotCard, RobotSetup } from '@/widgets/robot-setup';

import { useChangeLanguage } from '@/features/change-language';

import type { RobotDogAction, RobotDogSkin } from '@/entities/robot-dog';
import {
  useIsAnimationEnabled,
  useIsCameraRigEnabled,
  useIsSoundEnabled,
  useRobotAction,
  useRobotSkin,
  useUpdateUser,
} from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
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
  const [isSetupVisible, setSetupVisible] = useState(false);
  const { t } = useTranslation();
  const { languagePreference, changeLanguage } = useChangeLanguage();
  const updateUser = useUpdateUser();
  const isAnimationEnabled = useIsAnimationEnabled();
  const isSoundEnabled = useIsSoundEnabled();
  const isCameraRigEnabled = useIsCameraRigEnabled();
  const robotSkin = useRobotSkin();
  const robotAction = useRobotAction();

  const setPetSkin = (skin: RobotDogSkin) =>
    updateUser((u) => ({ ...u, settings: { ...u.settings, robotSkin: skin } }));

  const setPetAction = (action: RobotDogAction) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, robotAction: action },
    }));

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

  const setCameraRig = (isEnabled: boolean) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, isCameraRigEnabled: isEnabled },
    }));

  return (
    <Screen gap="three">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>{t('settings.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <Button variant="secondary" onPress={() => setSetupVisible(true)}>
        {t('setup.edit')}
      </Button>
      {isSetupVisible && <RobotSetup onClose={() => setSetupVisible(false)} />}
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

      <RobotCard
        skin={robotSkin}
        action={robotAction}
        onSkinChange={setPetSkin}
        onActionChange={setPetAction}
      />

      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.handbook')}</Card.Title>
        <Card.Content style={styles.handbook}>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.historyDescription')}
          </Text>
          <Button
            size="m"
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.HISTORY)}
          >
            {t('settings.openHistory')}
          </Button>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.glossaryDescription')}
          </Text>
          <Button
            size="m"
            variant="secondary"
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.GLOSSARY)}
          >
            {t('settings.openGlossary')}
          </Button>
        </Card.Content>
      </Card>

      {__DEV__ ? (
        <Card tone="surfaceSoft">
          <Card.Title>{t('settings.development')}</Card.Title>
          <Card.Content style={styles.toggles}>
            <ListRow
              title={t('settings.cameraRig')}
              subtitle={t('settings.cameraRigSubtitle')}
              trailing={
                <Switch
                  isChecked={isCameraRigEnabled}
                  onChange={setCameraRig}
                  label={t('settings.cameraRig')}
                />
              }
            />
            <Text variant="small" themeColor="textSecondary">
              {t('settings.uiKitDescription')}
            </Text>
            <Button
              size="m"
              isFullWidth
              onPress={() => router.push(STATIC_ROUTES.UI_KIT)}
            >
              {t('settings.openUiKit')}
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {/* Last and quiet — docs/parents.md: the panel a child sees every day
          must not advertise the room they are not allowed into. */}
      <Card tone="surfaceSoft">
        <Card.Title>{t('settings.parents')}</Card.Title>
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('settings.parentsDescription')}
          </Text>
        </Card.Content>
        <Card.Footer>
          <Button
            size="m"
            variant="secondary"
            isFullWidth
            onPress={() => router.push(STATIC_ROUTES.PARENTS)}
          >
            {t('settings.openParents')}
          </Button>
        </Card.Footer>
      </Card>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  handbook: {
    gap: SPACING.two,
  },
  langButtons: {
    gap: SPACING.two,
  },
  toggles: {
    gap: SPACING.two,
  },
});
