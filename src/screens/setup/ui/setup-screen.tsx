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

import {
  DYNAMIC_ROUTES,
  RADII,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import {
  Button,
  Card,
  Chip,
  Input,
  PixelIcon,
  type PixelIconName,
  Screen,
  Text,
} from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BOXES: { icon: PixelIconName; key: 'needs' | 'wants' | 'savings' }[] = [
  { icon: 'battery', key: 'needs' },
  { icon: 'gear', key: 'wants' },
  { icon: 'piggy', key: 'savings' },
];

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const SetupScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
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
    router.replace(DYNAMIC_ROUTES.story('intro'));
  };

  return (
    <Screen gap={SPACING.THREE}>
      <Screen.Header>
        <Screen.Heading>
          <Screen.Label>
            {t(isStoryVisible ? 'setup.storyLabel' : 'setup.formLabel')}
          </Screen.Label>
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
            <Text themeColor="textSecondary">{t('setup.story')}</Text>
            {BOXES.map(({ icon, key }) => (
              <Card key={key}>
                <View style={styles.direction}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: theme.surfaceSoft },
                    ]}
                  >
                    <PixelIcon name={icon} />
                  </View>
                  <View style={styles.directionText}>
                    <Text variant="bodyBold">
                      {t(`setup.boxes.${key}.title`)}
                    </Text>
                    <Text variant="small" themeColor="textMuted">
                      {t(`setup.boxes.${key}.hint`)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            <Text variant="small" themeColor="textSecondary">
              {t('setup.safeError')}
            </Text>
            <Button isFullWidth onPress={() => setStoryVisible(false)}>
              {t('setup.meet')}
            </Button>
          </View>
        ) : (
          <View style={styles.stack}>
            <Text themeColor="textSecondary">{t('setup.privacy')}</Text>
            <Text variant="small" themeColor="textSecondary">
              {t('setup.playerName')}
            </Text>
            <Input
              accessibilityLabel={t('setup.playerName')}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={PLAYER_NAME_MAX_LENGTH}
              isCounterVisible
              autoCorrect={false}
            />
            <Text variant="small" themeColor="textSecondary">
              {t('setup.robotName')}
            </Text>
            <Input
              accessibilityLabel={t('setup.robotName')}
              value={robotName}
              onChangeText={setRobotName}
              maxLength={ROBOT_NAME_MAX_LENGTH}
              isCounterVisible
              autoCorrect={false}
            />
            <Text variant="small" themeColor="textMuted">
              {t('setup.nameHint')}
            </Text>
            <RobotCard skin={skin} onSkinChange={setSkin} />
            {(['head', 'body', 'legs'] as const).map((part) => (
              <View key={part} style={styles.part}>
                <Text variant="small" themeColor="textSecondary">
                  {t(`setup.modules.${part}.title`)}
                </Text>
                <View style={styles.chips}>
                  {[0, 1, 2].map((choice) => (
                    <Chip
                      key={choice}
                      variant={
                        assembly[part] === choice ? 'selected' : 'neutral'
                      }
                      onPress={() =>
                        setAssembly((current) => ({
                          ...current,
                          [part]: choice,
                        }))
                      }
                    >
                      {t(`setup.modules.${part}.${choice}`)}
                    </Chip>
                  ))}
                </View>
              </View>
            ))}
            {!isValid && (
              <Text accessibilityLiveRegion="polite">
                {t('setup.emptyName')}
              </Text>
            )}
            <Button isFullWidth disabled={!isValid} onPress={save}>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.TWO },
  direction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.COMPACT,
  },
  directionText: { flex: 1 },
  flex: { flex: 1 },
  iconBox: {
    alignItems: 'center',
    borderRadius: RADII.s,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  part: { gap: SPACING.TWO, marginTop: SPACING.ONE },
  stack: { gap: SPACING.TWO },
});
