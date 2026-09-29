import { useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RobotLookPicker } from '@/widgets/robot-setup';
import { RobotStage } from '@/widgets/room-scene';

import {
  DEFAULT_ROBOT_ASSEMBLY,
  isRobotNameValid,
  ROBOT_DOG_SKINS,
  ROBOT_EARS,
  ROBOT_FACES,
  ROBOT_NAME_MAX_LENGTH,
  type RobotAssembly,
  type RobotDogSkin,
  type RobotEars,
  type RobotFace,
} from '@/entities/robot-dog';
import {
  applyIdentity,
  useIsMotionEnabled,
  useUpdateUser,
  useUser,
} from '@/entities/user';

import {
  DYNAMIC_ROUTES,
  MAX_CONTENT_WIDTH,
  SPACING,
  STATIC_ROUTES,
  TERMINAL_VARIANT,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Input, TerminalPanel, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** The last thing the child picked — what Knopka answers. */
type Reaction = RobotDogSkin | RobotEars | RobotFace | 'hello';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** The sheet never hides the dog: above this share of the window it scrolls. */
const SHEET_MAX_SHARE = 0.68;
/** How far the sheet's rounded top rides over the stand. */
const SHEET_OVERLAP = SPACING.FOUR;
/** Room under the dog's paws for the turn hint. */
const HINT_CLEARANCE = SPACING.SIX;
/**
 * Below this window height (16:9 phones, large text) the sheet tightens and the turn hint goes,
 * so the dog keeps a readable size and the start button stays on screen.
 */
const COMPACT_HEIGHT = 760;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const pickOther = <T,>(values: readonly T[], current: T): T => {
  const others = values.filter((value) => value !== current);
  return others[Math.floor(Math.random() * others.length)] ?? current;
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** First launch: the dog stands on the concrete, the child names and dresses it from a sheet. */
export const SetupScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < COMPACT_HEIGHT;
  const user = useUser();
  const updateUser = useUpdateUser();
  const isAnimated = useIsMotionEnabled();
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
  const [reaction, setReaction] = useState<Reaction>('hello');
  // The band the dog is framed in: under Knopka's line, over the sheet.
  const [bubbleBottom, setBubbleBottom] = useState<number | null>(null);
  const [standBottom, setStandBottom] = useState<number | null>(null);

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (user.playerName && user.robot.name)
    return <Redirect href={STATIC_ROUTES.HOME} />;

  const ears = assembly.ears ?? 'floppy';
  const face = assembly.face ?? 'dots';
  const isValid = isRobotNameValid(robotName);

  const pickSkin = (value: RobotDogSkin) => {
    setSkin(value);
    setReaction(value);
  };
  const pickEars = (value: RobotEars) => {
    setAssembly((current) => ({ ...current, ears: value }));
    setReaction(value);
  };
  const pickFace = (value: RobotFace) => {
    setAssembly((current) => ({ ...current, face: value }));
    setReaction(value);
  };
  const randomize = () => {
    const nextEars = pickOther(ROBOT_EARS, ears);
    setSkin(pickOther(ROBOT_DOG_SKINS, skin));
    setAssembly((current) => ({
      ...current,
      ears: nextEars,
      face: pickOther(ROBOT_FACES, face),
    }));
    setReaction(nextEars);
  };

  const save = () => {
    if (!isValid) return;
    // The child's own callsign is asked for later, in settings; the first screen is about the dog.
    const playerName = user.playerName || t('setup.defaultPlayer');
    updateUser((current) =>
      applyIdentity(current, { playerName, robotName, skin, assembly }),
    );
    Keyboard.dismiss();
    router.replace(DYNAMIC_ROUTES.story('intro'));
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.sceneLight }]}>
      {/* Outside the keyboard avoider: a shrinking stand would rebuild the GL context. */}
      <RobotStage
        skin={skin}
        assembly={assembly}
        isAnimated={isAnimated}
        accessibilityLabel={t('setup.stageLabel', {
          name: robotName,
          coat: t(`settings.skin.${skin}`),
          ears: t(`setup.look.${ears}`),
          face: t(`setup.look.${face}`),
        })}
        band={
          bubbleBottom !== null && standBottom !== null
            ? {
                top: bubbleBottom + SPACING.TWO,
                bottom:
                  standBottom - (isCompact ? SPACING.TWO : HINT_CLEARANCE),
              }
            : null
        }
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          pointerEvents="box-none"
          style={styles.stand}
          onLayout={(event) =>
            setStandBottom(event.nativeEvent.layout.height - SHEET_OVERLAP)
          }
        >
          <View
            pointerEvents="none"
            style={[styles.bubble, { top: insets.top + SPACING.TWO }]}
            onLayout={(event) => {
              const { y, height: bubbleHeight } = event.nativeEvent.layout;
              // Once: a longer line must not shrink the dog mid-sentence.
              setBubbleBottom((current) => current ?? y + bubbleHeight);
            }}
          >
            <TerminalPanel variant={TERMINAL_VARIANT.KEEPER} size="m">
              <View style={styles.bubbleBody} accessibilityLiveRegion="polite">
                <Text variant="machine">{`> ${t('setup.speaker')}`}</Text>
                <Text variant="bodyBold">
                  {t(`setup.reactions.${reaction}`)}
                </Text>
              </View>
            </TerminalPanel>
          </View>
          {isCompact ? null : (
            <View pointerEvents="none" style={styles.hint}>
              <TerminalPanel size="s" isLampVisible={false}>
                <Text variant="machine" style={styles.hintText}>
                  {`> ${t('setup.turnHint')}`}
                </Text>
              </TerminalPanel>
            </View>
          )}
        </View>

        <TerminalPanel
          frameStyle={[
            styles.sheet,
            {
              maxHeight: height * SHEET_MAX_SHARE,
              paddingBottom: insets.bottom + SPACING.TWO,
            },
          ]}
          style={styles.sheetScreen}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              isCompact && styles.contentCompact,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.heading}>
              <Text variant="machine">{`> ${t('setup.formLabel')}`}</Text>
              <Text variant="title">{t('setup.question')}</Text>
            </View>
            <Input
              accessibilityLabel={t('setup.robotName')}
              value={robotName}
              onChangeText={setRobotName}
              maxLength={ROBOT_NAME_MAX_LENGTH}
              autoCorrect={false}
              isCounterVisible
            />
            <RobotLookPicker
              skin={skin}
              assembly={assembly}
              onSkinChange={pickSkin}
              onEarsChange={pickEars}
              onFaceChange={pickFace}
            />
            {isValid ? null : (
              <Text
                variant="small"
                themeColor="warning"
                accessibilityLiveRegion="polite"
              >
                {t('setup.emptyName')}
              </Text>
            )}
            <View style={styles.actions}>
              <Button variant="secondary" onPress={randomize}>
                {t('setup.random')}
              </Button>
              <View style={styles.primary}>
                <Button isFullWidth disabled={!isValid} onPress={save}>
                  {t('setup.start')}
                </Button>
              </View>
            </View>
          </ScrollView>
        </TerminalPanel>
      </KeyboardAvoidingView>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.TWO,
  },
  bubble: {
    left: SPACING.THREE,
    maxWidth: 360,
    position: 'absolute',
    right: SPACING.THREE,
  },
  bubbleBody: {
    gap: SPACING.HALF,
    paddingHorizontal: SPACING.COMPACT,
    paddingVertical: SPACING.TWO,
  },
  content: {
    gap: SPACING.COMPACT,
    padding: SPACING.THREE,
  },
  contentCompact: {
    gap: SPACING.TWO,
    paddingVertical: SPACING.COMPACT,
  },
  heading: {
    gap: SPACING.HALF,
  },
  hint: {
    alignSelf: 'center',
    bottom: SHEET_OVERLAP + SPACING.TWO,
    position: 'absolute',
  },
  hintText: {
    paddingHorizontal: SPACING.TWO,
    paddingVertical: SPACING.ONE,
  },
  primary: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  sheet: {
    alignSelf: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginTop: -SHEET_OVERLAP,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  sheetScreen: {
    flexShrink: 1,
  },
  stand: {
    flex: 1,
  },
});
