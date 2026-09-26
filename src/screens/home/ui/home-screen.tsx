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
import { cellKey, SCENE_PALETTE, SCENE_TERRACE_COUNT } from '@/entities/scene';
import {
  useDoneCells,
  useDoneLessonIds,
  useHomeScreenData,
  useIsCameraRigEnabled,
  useIsMotionEnabled,
  useRobotAction,
  useRobotSkin,
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
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    watcher?: string;
    page?: string;
  }>();
  const robotSkin = useRobotSkin();
  const chosenAction = useRobotAction();
  const homeData = useHomeScreenData();
  const isMotionEnabled = useIsMotionEnabled();
  const isCameraRigEnabled = useIsCameraRigEnabled();
  const [view, setView] = useState<SceneView>('top');
  const [talkingTo, setTalkingTo] = useState<WatcherId | null>(null);
  const [isBonding, setIsBonding] = useState(false);
  const [terminalPage, setTerminalPage] = useState<WatcherPageId>('greeting');
  const isNavigating = useRef(false);
  const doneCells = useDoneCells();
  const doneLessonIds = useDoneLessonIds();

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
      return () => {
        setIsBonding(false);
      };
    }, []),
  );

  // Deep-link from /shop or /budget-plan redirects.
  useEffect(() => {
    if (!isWatcherId(params.watcher)) return;
    setTalkingTo(params.watcher);
    setIsBonding(false);
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

  const setWatcherFocus = (watcher: WatcherId | null) => {
    setTalkingTo(watcher);
    setTerminalPage('greeting');
    if (watcher) setIsBonding(false);
  };

  const setBonding = (next: boolean) => {
    setIsBonding(next);
    if (next) {
      setTalkingTo(null);
      setTerminalPage('greeting');
    }
  };

  if (!homeData) return <Redirect href={STATIC_ROUTES.ENTRY} />;
  if (!homeData.playerName || !homeData.robotName) {
    return <Redirect href={STATIC_ROUTES.SETUP} />;
  }
  if (!homeData.seenStoryIds.includes('intro')) {
    return <Redirect href={DYNAMIC_ROUTES.story('intro')} />;
  }
  if (
    homeData.platformLevel >= PLATFORM_LEVEL_COUNT &&
    !homeData.seenStoryIds.includes('finale')
  ) {
    return <Redirect href={DYNAMIC_ROUTES.story('finale')} />;
  }
  if (homeData.periodPhase === 'summary') {
    return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;
  }

  const mood = moodFor(homeData.robotCharge, homeData.robotSpirit);
  const gameState: WatcherGameState = {
    phase: homeData.periodPhase,
    charge: homeData.robotCharge,
    spirit: homeData.robotSpirit,
    hasActiveTask: !!homeData.activeTaskId,
    areNeedsMet: homeData.periodFact.needs >= homeData.periodPlan.needs,
    balance: homeData.balance,
    periodIndex: homeData.periodIndex,
    platformLevel: homeData.platformLevel,
    moduleTier: homeData.moduleTier,
  };

  const currentLine = talkingTo
    ? pickLine(
        talkingTo === 'overseer' ? OVERSEER_LINES : KEEPER_LINES,
        gameState,
      )
    : null;

  return (
    <ThemedView
      variant="background"
      style={[styles.root, { backgroundColor: SCENE_PALETTE.background }]}
    >
      <View style={styles.world}>
        <RoomScene
          view={view}
          onViewChange={(next) => {
            setView(next);
            if (next === 'top') setIsBonding(false);
          }}
          level={homeData.platformLevel}
          robotSkin={robotSkin}
          robotAssembly={homeData.robotAssembly}
          robotStage={homeData.robotStage}
          robotAction={actionForMood(mood.name, chosenAction)}
          bondMood={mood.name}
          isBonding={isBonding}
          onBondChange={setBonding}
          focusedWatcher={talkingTo}
          onWatcherFocus={setWatcherFocus}
          doneCells={doneCells}
          doneLessonIds={doneLessonIds}
          mapHud={{
            balance: homeData.balance,
            tier: homeData.platformLevel,
            tierTotal: SCENE_TERRACE_COUNT,
            charge: homeData.robotCharge,
          }}
          onCellPress={(cell) => {
            const key = cellKey(cell);
            const ordinal = lessonOrdinalForKey(key);
            if (ordinal === null) return;
            if (
              lessonAccess(ordinal, doneLessonIds, homeData.platformLevel)
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
          <SettingsIcon color={SCENE_PALETTE.cellFrame} />
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
