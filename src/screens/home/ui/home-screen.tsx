import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Href,
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomScene, type SceneView } from '@/widgets/room-scene';
import { WatcherTerminal } from '@/widgets/watcher-terminal';

import { PLATFORM_LEVEL_COUNT } from '@/entities/economy';
import { lessonAccess, lessonOrdinalForKey } from '@/entities/lesson';
import { actionForMood, moodFor } from '@/entities/robot-dog';
import { cellKey, SCENE_TERRACE_COUNT } from '@/entities/scene';
import {
  hasSeenStory,
  useDoneCells,
  useDoneLessonIds,
  useIsCameraRigEnabled,
  useIsMotionEnabled,
  useRobotAction,
  useRobotSkin,
  useUser,
} from '@/entities/user';
import {
  KEEPER_LINES,
  OVERSEER_LINES,
  pickLine,
  WATCHER_IDS,
  type WatcherGameState,
  type WatcherId,
  type WatcherPageId,
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
// HELPERS
// ═══════════════════════════════════════════

const isWatcherId = (value: unknown): value is WatcherId =>
  typeof value === 'string' &&
  (WATCHER_IDS as readonly string[]).includes(value);

const isWatcherPage = (value: unknown): value is WatcherPageId =>
  value === 'greeting' ||
  value === 'plan' ||
  value === 'shop' ||
  value === 'jar' ||
  value === 'report' ||
  value === 'trials' ||
  value === 'arcade';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The arena is the home screen: the map, the robot, the two AIs.
 *
 * Plan, jar and shop live on the Keeper terminal; trials and arcade on the
 * Overseer. On the overhead map three boards show coins, tier and charge.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    watcher?: string;
    page?: string;
  }>();
  const robotSkin = useRobotSkin();
  const chosenAction = useRobotAction();
  const user = useUser();
  const isMotionEnabled = useIsMotionEnabled();
  const isCameraRigEnabled = useIsCameraRigEnabled();
  const [view, setView] = useState<SceneView>(0);
  const [talkingTo, setTalkingTo] = useState<WatcherId | null>(null);
  const [terminalPage, setTerminalPage] = useState<WatcherPageId>('greeting');
  const isNavigating = useRef(false);
  const doneCells = useDoneCells();
  const doneLessonIds = useDoneLessonIds();

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
    }, []),
  );

  // Deep-link from /shop or /budget-plan redirects.
  useEffect(() => {
    if (!isWatcherId(params.watcher)) return;
    setTalkingTo(params.watcher);
    setTerminalPage(isWatcherPage(params.page) ? params.page : 'greeting');
  }, [params.watcher, params.page]);

  const navigate = (href: Href) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push(href);
  };

  const leaveTerminal = () => {
    setTalkingTo(null);
    setTerminalPage('greeting');
  };

  if (!user) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (!user.playerName || !user.robot.name) {
    return <Redirect href={STATIC_ROUTES.SETUP} />;
  }
  if (!hasSeenStory(user, 'intro')) {
    return <Redirect href={DYNAMIC_ROUTES.story('intro')} />;
  }
  if (
    user.platform.level >= PLATFORM_LEVEL_COUNT &&
    !hasSeenStory(user, 'finale')
  ) {
    return <Redirect href={DYNAMIC_ROUTES.story('finale')} />;
  }
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
          onWatcherFocus={(watcher) => {
            setTalkingTo(watcher);
            setTerminalPage('greeting');
          }}
          doneCells={doneCells}
          doneLessonIds={doneLessonIds}
          mapHud={{
            balance: user.wallet.balance,
            tier: user.platform.level,
            tierTotal: SCENE_TERRACE_COUNT,
            charge: user.robot.charge,
          }}
          onCellPress={(cell) => {
            const key = cellKey(cell);
            const ordinal = lessonOrdinalForKey(key);
            if (ordinal === null) return;
            if (
              lessonAccess(ordinal, doneLessonIds, user.platform.level)
                .status === 'LOCKED'
            ) {
              return;
            }
            navigate(DYNAMIC_ROUTES.lesson(key));
          }}
          isAnimated={isMotionEnabled}
          isCameraRig={isCameraRigEnabled}
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

        {talkingTo && currentLine ? (
          <WatcherTerminal
            key={`${talkingTo}-${terminalPage}`}
            watcher={talkingTo}
            line={currentLine}
            initialPage={terminalPage}
            onLeave={leaveTerminal}
          />
        ) : null}
      </View>
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
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
