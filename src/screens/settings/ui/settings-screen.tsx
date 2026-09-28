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
  useIsTextureEnabled,
  useRobotAction,
  useRobotSkin,
  useUpdateUser,
} from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import type { LanguagePreference } from '@/shared/types';
import {
  Button,
  ListGroup,
  PixelIcon,
  Screen,
  Segmented,
  Switch,
  Text,
} from '@/shared/ui';

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
  const isTextureEnabled = useIsTextureEnabled();
  const isCameraRigEnabled = useIsCameraRigEnabled();
  const robotSkin = useRobotSkin();
  const robotAction = useRobotAction();

  const setRobotSkin = (skin: RobotDogSkin) =>
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

  const setTexture = (isEnabled: boolean) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, isTextureEnabled: isEnabled },
    }));

  const setCameraRig = (isEnabled: boolean) =>
    updateUser((u) => ({
      ...u,
      settings: { ...u.settings, isCameraRigEnabled: isEnabled },
    }));

  return (
    <Screen presentation="sheet" gap={SPACING.COMPACT}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>{t('settings.label')}</Screen.Label>
          <Screen.Title>{t('settings.title')}</Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <ListGroup>
        <ListGroup.Item
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
        <ListGroup.Item
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
        <ListGroup.Item
          title={t('settings.texture')}
          subtitle={t('settings.textureSubtitle')}
          trailing={
            <Switch
              isChecked={isTextureEnabled}
              onChange={setTexture}
              label={t('settings.texture')}
            />
          }
        />
      </ListGroup>

      <View style={styles.section}>
        <Text variant="smallBold">{t('settings.language')}</Text>
        <Segmented
          options={LANGUAGE_OPTIONS.map(({ value, labelKey }) => ({
            value,
            label: t(labelKey),
          }))}
          value={languagePreference}
          onChange={changeLanguage}
        />
      </View>

      <ListGroup>
        <ListGroup.Item
          title={t('settings.appearance')}
          subtitle={t('settings.appearanceSubtitle')}
          onPress={() => setSetupVisible(true)}
        />
        <ListGroup.Item
          icon="clock"
          title={t('settings.openHistory')}
          subtitle={t('settings.historyDescription')}
          onPress={() => router.push(STATIC_ROUTES.HISTORY)}
        />
        <ListGroup.Item
          icon="book"
          title={t('settings.openGlossary')}
          subtitle={t('settings.glossaryDescription')}
          onPress={() => router.push(STATIC_ROUTES.GLOSSARY)}
        />
      </ListGroup>
      {isSetupVisible && <RobotSetup onClose={() => setSetupVisible(false)} />}

      <RobotCard
        skin={robotSkin}
        action={robotAction}
        onSkinChange={setRobotSkin}
        onActionChange={setPetAction}
      />

      {__DEV__ ? (
        <ListGroup>
          <ListGroup.Item
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
          <ListGroup.Item
            title={t('settings.openUiKit')}
            subtitle={t('settings.uiKitDescription')}
            onPress={() => router.push(STATIC_ROUTES.UI_KIT)}
          />
        </ListGroup>
      ) : null}

      {/* Last and quiet — docs/parents.md: the panel a child sees every day must not advertise the room they are not allowed into */}
      <Button
        size="m"
        variant="secondary"
        isFullWidth
        accessibilityHint={t('settings.parentsDescription')}
        onPress={() => router.push(STATIC_ROUTES.PARENTS)}
      >
        <PixelIcon name="lock" size={12} tone="textSecondary" />
        <Button.Label>{t('settings.openParents')}</Button.Label>
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  section: { gap: SPACING.TWO },
});
