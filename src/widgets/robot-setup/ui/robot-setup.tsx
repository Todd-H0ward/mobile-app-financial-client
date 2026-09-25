import { useState } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

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
  useIsMotionEnabled,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, Sheet, Text } from '@/shared/ui';

import { RobotCard } from './robot-card';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotSetupProps {
  isIntroduction?: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Mounted only while open, so each edit starts from the latest saved identity. */
export const RobotSetup = ({
  isIntroduction = false,
  onClose,
}: RobotSetupProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const updateUser = useUpdateUser();
  const isAnimated = useIsMotionEnabled();
  const { height } = useWindowDimensions();
  const [isStoryVisible, setStoryVisible] = useState(isIntroduction);
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

  const save = () => {
    if (!isValid) return;
    updateUser((current) =>
      applyIdentity(current, { playerName, robotName, skin, assembly }),
    );
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Sheet.Modal
      isVisible
      isDismissible={!isIntroduction}
      isAnimated={isAnimated}
      onClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.root, { maxHeight: height * 0.7 }]}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Sheet.Title>
            {t(isStoryVisible ? 'setup.welcome' : 'setup.title')}
          </Sheet.Title>
          {isStoryVisible ? (
            <>
              <Text>{t('setup.story')}</Text>
              <Text>{t('setup.needs')}</Text>
              <Text>{t('setup.wants')}</Text>
              <Text>{t('setup.savings')}</Text>
              <Text themeColor="textSecondary">{t('setup.safeError')}</Text>
              <Button onPress={() => setStoryVisible(false)}>
                {t('setup.meet')}
              </Button>
            </>
          ) : (
            <>
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
              {isIntroduction &&
                (['head', 'body', 'legs'] as const).map((part) => (
                  <View key={part} style={styles.actions}>
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
              <View style={styles.actions}>
                <Button disabled={!isValid} onPress={save}>
                  {t(isIntroduction ? 'setup.start' : 'setup.save')}
                </Button>
                {!isIntroduction && (
                  <Button variant="secondary" onPress={onClose}>
                    {t('common.back')}
                  </Button>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet.Modal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: { gap: SPACING.two },
  content: { gap: SPACING.two, paddingBottom: SPACING.two },
  root: { flexGrow: 0 },
});

export type { RobotSetupProps };
