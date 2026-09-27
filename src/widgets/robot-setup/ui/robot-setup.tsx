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
  isRobotNameValid,
  ROBOT_NAME_MAX_LENGTH,
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
  onClose: () => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Edit names and coat from settings. */
export const RobotSetup = ({ onClose }: RobotSetupProps) => {
  const { t } = useTranslation();
  const user = useUser();
  const updateUser = useUpdateUser();
  const isAnimated = useIsMotionEnabled();
  const { height } = useWindowDimensions();
  const [playerName, setPlayerName] = useState(
    user?.playerName || t('setup.defaultPlayer'),
  );
  const [robotName, setRobotName] = useState(
    user?.robot.name || t('setup.defaultRobot'),
  );
  const [skin, setSkin] = useState<RobotDogSkin>(
    user?.settings.robotSkin ?? 'factory',
  );
  const isValid = isPlayerNameValid(playerName) && isRobotNameValid(robotName);

  const save = () => {
    if (!isValid || !user) return;
    updateUser((current) =>
      applyIdentity(current, {
        playerName,
        robotName,
        skin,
        assembly: current.robot.assembly,
      }),
    );
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Sheet.Modal
      isVisible
      isDismissible
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
          <Sheet.Label>{t('setup.formLabel')}</Sheet.Label>
          <Sheet.Title>{t('setup.title')}</Sheet.Title>
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
          {!isValid && (
            <Text accessibilityLiveRegion="polite">{t('setup.emptyName')}</Text>
          )}
          <View style={styles.actions}>
            <Button isFullWidth disabled={!isValid} onPress={save}>
              {t('setup.save')}
            </Button>
            <Button variant="ghost" size="s" isFullWidth onPress={onClose}>
              {t('common.back').toLocaleLowerCase()}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet.Modal>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: { gap: SPACING.TWO },
  content: { gap: SPACING.TWO, paddingBottom: SPACING.TWO },
  root: { flexGrow: 0 },
});

export type { RobotSetupProps };
