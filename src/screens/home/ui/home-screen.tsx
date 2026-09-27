import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Href,
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from 'expo-router';
import {
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RobotDiagnostics } from '@/widgets/robot-profile';
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
  DYNAMIC_ROUTES,
  isSheetPath,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { TerminalDock, ThemedView } from '@/shared/ui';

import { useHomeHud } from '../model';

import { HomeDock, HomeHudBoard } from './home-hud';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** How far the canvas rides up under the diagnostics, share of the window. */
const ROBOT_PANEL_SHIFT = 0.24;
const SCENE_SHIFT_MS = 340;

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
  const hud = useHomeHud();
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
  /** Diagnostics docked under the dog's close-up (screen 10). */
  const [isRobotOpen, setIsRobotOpen] = useState(false);
  const isRobotOpenRef = useRef(false);
  /** Where the camera stood before the close-up, to walk back to it. */
  const viewBeforeRobot = useRef<SceneView | null>(null);
  isRobotOpenRef.current = isRobotOpen;
  const isNavigating = useRef(false);
  // A sheet over home takes focus but leaves the pit in view; only an opaque
  // route may stop the scene, or coming back from one lands on an empty frame.
  const pathname = usePathname();
  const isArenaCovered =
    pathname !== STATIC_ROUTES.HOME && !isSheetPath(pathname);
  const { height: windowHeight } = useWindowDimensions();
  const sceneShift = useSharedValue(0);

  // The close-up centres the dog on the canvas; with the diagnostics docked
  // below, the canvas rides up so the face sits above the panel. Only the
  // canvas moves — the scene and its camera are left as they are.
  useEffect(() => {
    sceneShift.value = withTiming(
      isRobotOpen ? -windowHeight * ROBOT_PANEL_SHIFT : 0,
      {
        duration: isMotionEnabled ? SCENE_SHIFT_MS : 0,
        easing: Easing.out(Easing.cubic),
      },
    );
  }, [isRobotOpen, isMotionEnabled, sceneShift, windowHeight]);

  const sceneShiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sceneShift.value }],
  }));
  const doneCells = useDoneCells();
  const doneLessonIds = useDoneLessonIds();

  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
      return () => {
        // The modules sheet opens over the diagnostics: keep the close-up
        // behind it instead of flying the camera back under the sheet.
        if (!isRobotOpenRef.current) setIsBonding(false);
      };
    }, []),
  );

  // Android back closes what is open over the arena before leaving the app.
  useEffect(() => {
    if (!talkingTo && !isRobotOpen) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isRobotOpenRef.current) setBonding(false);
        else leaveTerminal();
        return true;
      },
    );
    return () => subscription.remove();
  });

  // Deep-link into a terminal page — sheets send the child here with `dismissTo`.
  useEffect(() => {
    if (!isWatcherId(params.watcher)) return;
    setTalkingTo(params.watcher);
    setIsBonding(false);
    setIsRobotOpen(false);
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
    if (watcher) {
      setIsBonding(false);
      setIsRobotOpen(false);
    }
  };

  const openRobot = () => {
    setTalkingTo(null);
    setTerminalPage('greeting');
    // The close-up is framed from inside a bay; from the overhead map the
    // lens would look at the dog through the rim wall.
    viewBeforeRobot.current = view;
    if (view === 'top') setView(0);
    setIsBonding(true);
    setIsRobotOpen(true);
  };

  const setBonding = (next: boolean) => {
    setIsBonding(next);
    if (!next && isRobotOpenRef.current) {
      setIsRobotOpen(false);
      if (viewBeforeRobot.current !== null) setView(viewBeforeRobot.current);
      viewBeforeRobot.current = null;
    }
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
        <Animated.View style={[StyleSheet.absoluteFill, sceneShiftStyle]}>
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
            isCovered={isArenaCovered}
          />
        </Animated.View>

        {isRobotOpen ? (
          <TerminalDock>
            <RobotDiagnostics
              onClose={() => setBonding(false)}
              onModules={() => navigate(STATIC_ROUTES.MODULES)}
            />
          </TerminalDock>
        ) : null}

        {!talkingTo && !isRobotOpen ? (
          <>
            <HomeHudBoard
              hud={hud}
              level={homeData.platformLevel}
              charge={homeData.robotCharge}
              top={insets.top}
              onSettings={() => navigate(STATIC_ROUTES.SETTINGS)}
              onRobot={openRobot}
            />
            <HomeDock
              hud={hud}
              bottom={insets.bottom + SPACING.compact}
              onOpen={(watcher, page) => {
                setTalkingTo(watcher);
                setTerminalPage(page);
                setIsBonding(false);
              }}
              onRobot={openRobot}
              onTrial={(taskId) => navigate(DYNAMIC_ROUTES.task(taskId))}
            />
          </>
        ) : null}

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
  world: { flex: 1 },
});
