import { useState } from 'react';

import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { RobotTerminal } from '@/widgets/robot-profile';

import {
  DEFAULT_ROBOT_ASSEMBLY,
  isRobotNameValid,
  ROBOT_DOG_SKINS,
  ROBOT_NAME_MAX_LENGTH,
  type RobotAssembly,
  type RobotDogSkin,
} from '@/entities/robot-dog';
import { ROBOT_CHOICE_IMAGES, RobotDuo } from '@/entities/robot-dog/ui';
import {
  applyIdentity,
  isPlayerNameValid,
  PLAYER_NAME_MAX_LENGTH,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import { DYNAMIC_ROUTES, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, Screen, Segmented, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════
interface LookChoiceProps {
  source: number;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

type LookTab = 'coat' | 'ears' | 'face';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const EARS = ['floppy', 'blade', 'radar'] as const;
const FACES = ['dots', 'happy', 'wide'] as const;
const LOOK_TABS = ['coat', 'ears', 'face'] as const satisfies readonly LookTab[];

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
const LookChoice = ({
  source,
  label,
  isSelected,
  onPress,
}: LookChoiceProps) => {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: theme.terminalScreen,
          borderColor: isSelected ? theme.phosphor : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Image
        source={source}
        contentFit="contain"
        style={styles.preview}
        accessible={false}
        cachePolicy="disk"
      />
      <Text variant="small" style={styles.choiceLabel}>
        {isSelected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export const SetupScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();
  const updateUser = useUpdateUser();
  const [playerName, setPlayerName] = useState(
    user?.playerName || t('setup.defaultPlayer'),
  );
  const [robotName, setRobotName] = useState(
    user?.robot.name || t('setup.defaultRobot'),
  );
  const [skin, setSkin] = useState<RobotDogSkin>(
    user?.settings.robotSkin ?? 'factory',
  );
  const [assembly, setAssembly] = useState<RobotAssembly>({
    ...DEFAULT_ROBOT_ASSEMBLY,
    ...user?.robot.assembly,
    ears: user?.robot.assembly.ears ?? 'floppy',
    face: user?.robot.assembly.face ?? 'dots',
  });
  const [tab, setTab] = useState<LookTab>('coat');
  const [isNicknameVisible, setNicknameVisible] = useState(false);
  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (user.playerName && user.robot.name)
    return <Redirect href={STATIC_ROUTES.HOME} />;
  const isValid = isPlayerNameValid(playerName) && isRobotNameValid(robotName);
  const lookOptions = LOOK_TABS.map((key) => ({
    value: key,
    label: t(`setup.look.${key}`),
  }));
  const save = () => {
    if (!isValid) return;
    updateUser((current) =>
      applyIdentity(current, { playerName, robotName, skin, assembly }),
    );
    Keyboard.dismiss();
    router.replace(DYNAMIC_ROUTES.story('intro'));
  };
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <RobotTerminal
        variant="equipment"
        hero={<RobotDuo skin={skin} assembly={assembly} />}
      >
        <Screen.Heading style={styles.heading}>
          <Screen.Label>{t('setup.formLabel')}</Screen.Label>
          <Screen.Title>{t('setup.robotName')}</Screen.Title>
        </Screen.Heading>
        <Input
          accessibilityLabel={t('setup.robotName')}
          value={robotName}
          onChangeText={setRobotName}
          maxLength={ROBOT_NAME_MAX_LENGTH}
          autoCorrect={false}
          isCounterVisible
        />
        <Segmented options={lookOptions} value={tab} onChange={setTab} />
        <View style={styles.choices}>
          {tab === 'coat'
            ? ROBOT_DOG_SKINS.map((value) => (
                <LookChoice
                  key={value}
                  source={ROBOT_CHOICE_IMAGES.coat[value]}
                  label={t(`settings.skin.${value}`)}
                  isSelected={skin === value}
                  onPress={() => setSkin(value)}
                />
              ))
            : tab === 'ears'
              ? EARS.map((value) => (
                  <LookChoice
                    key={value}
                    source={ROBOT_CHOICE_IMAGES.ears[value]}
                    label={t(`setup.look.${value}`)}
                    isSelected={assembly.ears === value}
                    onPress={() => setAssembly((a) => ({ ...a, ears: value }))}
                  />
                ))
              : FACES.map((value) => (
                  <LookChoice
                    key={value}
                    source={ROBOT_CHOICE_IMAGES.face[value]}
                    label={t(`setup.look.${value}`)}
                    isSelected={assembly.face === value}
                    onPress={() => setAssembly((a) => ({ ...a, face: value }))}
                  />
                ))}
        </View>
        <Text
          variant="small"
          themeColor="textSecondary"
          accessibilityLiveRegion="polite"
        >
          {t(`setup.knopka.${tab}`)}
        </Text>
        <Button
          variant="ghost"
          size="s"
          onPress={() => setNicknameVisible((v) => !v)}
        >
          {t('setup.nickname', { name: playerName })}
        </Button>
        {isNicknameVisible && (
          <Input
            accessibilityLabel={t('setup.playerName')}
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            autoCorrect={false}
          />
        )}
        {!isValid && (
          <Text accessibilityLiveRegion="polite">{t('setup.emptyName')}</Text>
        )}
        <Button isFullWidth size="l" disabled={!isValid} onPress={save}>
          {t('setup.start')}
        </Button>
        <Text variant="small" themeColor="textMuted">
          {t('setup.nameHint')}
        </Text>
      </RobotTerminal>
    </KeyboardAvoidingView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const styles = StyleSheet.create({
  choice: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '33%',
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: SPACING.TWO,
  },
  choiceLabel: { textAlign: 'center', paddingHorizontal: SPACING.ONE },
  preview: { width: '100%', aspectRatio: 1.2 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.TWO },
  heading: { flex: 0 },
  root: { flex: 1 },
});

export type { LookChoiceProps };
