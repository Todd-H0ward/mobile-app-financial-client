import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { RobotCard } from '@/widgets/robot-setup';

import {
  DEFAULT_ROBOT_ASSEMBLY,
  isRobotNameValid,
  ROBOT_NAME_MAX_LENGTH,
  type RobotAssembly,
  type RobotDogSkin,
} from '@/entities/robot-dog';
import {
  applyIdentity,
  isPlayerNameValid,
  PLAYER_NAME_MAX_LENGTH,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * First-run introduction: story, then names, coat and modules.
 *
 * Lived in a sheet on `/home`, but the form needs a full screen — the modal
 * clipped the module choices and the story into a 70% height scroll.
 */
export const SetupScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();
  const [isStoryVisible, setStoryVisible] = useState(true);
  const [playerName, setPlayerName] = useState(
    user?.playerName || t('setup.defaultPlayer'),
  );
  const [robotName, setRobotName] = useState(
    user?.robot.name || t('setup.defaultRobot'),
  );
  const [skin, setSkin] = useState<RobotDogSkin>(
    user?.settings.robotSkin ?? 'factory',
  );
  const [assembly, setAssembly] = useState<RobotAssembly>(
    user?.robot.assembly ?? DEFAULT_ROBOT_ASSEMBLY,
  );
  const isValid = isPlayerNameValid(playerName) && isRobotNameValid(robotName);

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (user.playerName && user.robot.name) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const save = () => {
    if (!isValid) return;
    updateUser((current) =>
      applyIdentity(current, { playerName, robotName, skin, assembly }),
    );
    Keyboard.dismiss();
    router.replace(STATIC_ROUTES.HOME);
  };

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>
            {t(isStoryVisible ? 'setup.welcome' : 'setup.title')}
          </Screen.Title>
        </Screen.Heading>
      </Screen.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isStoryVisible ? (
          <View style={styles.stack}>
            <Text>{t('setup.story')}</Text>
            <Text>{t('setup.needs')}</Text>
            <Text>{t('setup.wants')}</Text>
            <Text>{t('setup.savings')}</Text>
            <Text themeColor="textSecondary">{t('setup.safeError')}</Text>
            <Button onPress={() => setStoryVisible(false)}>
              {t('setup.meet')}
            </Button>
          </View>
        ) : (
          <View style={styles.stack}>
            <Text themeColor="textSecondary">{t('setup.privacy')}</Text>
            <Text variant="bodyBold">{t('setup.playerName')}</Text>
            <Input
              accessibilityLabel={t('setup.playerName')}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={PLAYER_NAME_MAX_LENGTH}
              isCounterVisible
              autoCorrect={false}
            />
            <Text variant="bodyBold">{t('setup.robotName')}</Text>
            <Input
              accessibilityLabel={t('setup.robotName')}
              value={robotName}
              onChangeText={setRobotName}
              maxLength={ROBOT_NAME_MAX_LENGTH}
              isCounterVisible
              autoCorrect={false}
            />
            <RobotCard skin={skin} onSkinChange={setSkin} />
            {(['head', 'body', 'legs'] as const).map((part) => (
              <View key={part} style={styles.stack}>
                <Text variant="bodyBold">
                  {t(`setup.modules.${part}.title`)}
                </Text>
                {[0, 1, 2].map((choice) => (
                  <Button
                    key={choice}
                    variant={
                      assembly[part] === choice ? 'primary' : 'secondary'
                    }
                    accessibilityState={{
                      selected: assembly[part] === choice,
                    }}
                    onPress={() =>
                      setAssembly((current) => ({
                        ...current,
                        [part]: choice,
                      }))
                    }
                  >
                    {t(`setup.modules.${part}.${choice}`)}
                  </Button>
                ))}
              </View>
            ))}
            {!isValid && (
              <Text accessibilityLiveRegion="polite">
                {t('setup.emptyName')}
              </Text>
            )}
            <Button disabled={!isValid} onPress={save}>
              {t('setup.start')}
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: SPACING.two },
});
