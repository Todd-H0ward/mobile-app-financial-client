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

/**
 * Edit names and coat from settings.
 *
 * First-run introduction lives on `/setup` — this sheet is only the short
 * revisit, so it stays a modal.
 */
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
          <Sheet.Title>{t('setup.title')}</Sheet.Title>
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
          {!isValid && (
            <Text accessibilityLiveRegion="polite">{t('setup.emptyName')}</Text>
          )}
          <View style={styles.actions}>
            <Button disabled={!isValid} onPress={save}>
              {t('setup.save')}
            </Button>
            <Button variant="secondary" onPress={onClose}>
              {t('common.back')}
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
  actions: { gap: SPACING.two },
  content: { gap: SPACING.two, paddingBottom: SPACING.two },
  root: { flexGrow: 0 },
});

export type { RobotSetupProps };
