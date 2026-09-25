import { useCallback, useRef, useState } from 'react';

import { type Href, Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RobotSetup } from '@/widgets/robot-setup';
import { RoomScene, type SceneView } from '@/widgets/room-scene';
import { WatcherDialog } from '@/widgets/watcher-dialog';

import { lessonAccess, lessonOrdinalForKey } from '@/entities/lesson';
import { actionForMood, moodFor } from '@/entities/robot-dog';
import { cellKey } from '@/entities/scene';
import {
  useDoneCells,
  useIsMotionEnabled,
  useRobotAction,
  useRobotSkin,
  useUser,
} from '@/entities/user';
import {
  KEEPER_LINES,
  OVERSEER_LINES,
  pickLine,
  type WatcherGameState,
  type WatcherId,
} from '@/entities/watcher';

import {
  CONTENT_PADDING,
  DYNAMIC_ROUTES,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { SettingsIcon, ThemedView } from '@/shared/ui';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The arena is the home screen: the map, the robot, the two AIs.
 *
 * Plan and workshop live on the Keeper; chores live on the Overseer. Balance,
 * jar, charge and lift stay off this screen until they earn a place on the
 * 3D world — no HUD, no chrome menus.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const robotSkin = useRobotSkin();
  const chosenAction = useRobotAction();
  const user = useUser();
  const isMotionEnabled = useIsMotionEnabled();
  const [view, setView] = useState<SceneView>(0);
  const [talkingTo, setTalkingTo] = useState<WatcherId | null>(null);
  const isNavigating = useRef(false);
  const doneCells = useDoneCells();

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
    }, []),
  );

  const navigate = (href: Href) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push(href);
  };

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (user.period.phase === 'summary') {
    return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;
  }

  const mood = moodFor(user.robot.charge, user.robot.spirit);
  const gameState: WatcherGameState = {
    phase: user.period.phase,
    charge: user.robot.charge,
    spirit: user.robot.spirit,
    hasActiveTask: !!user.tasks.activeTaskId,
    areNeedsMet: user.period.fact.needs >= user.period.plan.needs,
    balance: user.wallet.balance,
    periodIndex: user.period.index,
    platformLevel: user.platform.level,
    moduleTier: user.modules.tier,
  };

  const currentLine = talkingTo
    ? pickLine(
        talkingTo === 'overseer' ? OVERSEER_LINES : KEEPER_LINES,
        gameState,
      )
    : null;

  return (
    <ThemedView variant="background" style={styles.root}>
      <View style={styles.world}>
        <RoomScene
          view={view}
          onViewChange={setView}
          level={user.platform.level}
          robotSkin={robotSkin}
          robotAssembly={user.robot.assembly}
          robotStage={user.robot.stage}
          robotAction={actionForMood(mood.name, chosenAction)}
          focusedWatcher={talkingTo}
          onWatcherFocus={setTalkingTo}
          doneCells={doneCells}
          onCellPress={(cell) => {
            const key = cellKey(cell);
            const ordinal = lessonOrdinalForKey(key);
            if (
              ordinal !== null &&
              lessonAccess(ordinal, doneCells, user.platform.level).status !==
                'LOCKED'
            ) {
              navigate(DYNAMIC_ROUTES.lesson(key));
              return;
            }
            navigate(STATIC_ROUTES.LESSON_MAP);
          }}
          isAnimated={isMotionEnabled}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.settingsA11y')}
          onPress={() => navigate(STATIC_ROUTES.SETTINGS)}
          style={[
            styles.settings,
            { top: insets.top + SPACING.one, right: CONTENT_PADDING },
          ]}
          hitSlop={12}
        >
          <SettingsIcon color={theme.textSecondary} />
        </Pressable>

        {talkingTo && currentLine && (
          <View
            style={[
              styles.dialogDock,
              { paddingBottom: insets.bottom + SPACING.two },
            ]}
            pointerEvents="box-none"
          >
            <WatcherDialog
              watcher={talkingTo}
              line={currentLine}
              onLeave={() => setTalkingTo(null)}
            />
          </View>
        )}
      </View>

      {(!user.playerName || !user.robot.name) && (
        <RobotSetup isIntroduction onClose={() => {}} />
      )}
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  dialogDock: {
    bottom: 0,
    left: CONTENT_PADDING,
    position: 'absolute',
    right: CONTENT_PADDING,
  },
  root: { flex: 1 },
  settings: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    position: 'absolute',
    zIndex: 2,
  },
  world: { flex: 1 },
});
