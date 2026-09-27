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
import { isLessonPlayable, lessonOrdinalForKey } from '@/entities/lesson';
import { actionForMood, moodFor } from '@/entities/robot-dog';
import { cellKey, SCENE_PALETTE } from '@/entities/scene';
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
  SOUNDS,
  SPACING,
  STATIC_ROUTES,
} from '@/shared/constants';
import { playSfx } from '@/shared/lib';
import { TerminalDock, ThemedView } from '@/shared/ui';

import { useHomeHud } from '../model';

import { HomeDock, HomeHudBoard } from './home-hud';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

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
  const [isRobotOpen, setIsRobotOpen] = useState(false);
  const [isSceneReady, setSceneReady] = useState(false);
  const isRobotOpenRef = useRef(false);
  const viewBeforeRobot = useRef<SceneView | null>(null);
  isRobotOpenRef.current = isRobotOpen;
  const isNavigating = useRef(false);
  // Sheets leave the pit visible; only opaque routes may stop the GL scene.
  const pathname = usePathname();
  const isArenaCovered =
    pathname !== STATIC_ROUTES.HOME && !isSheetPath(pathname);
  const { height: windowHeight } = useWindowDimensions();
  const sceneShift = useSharedValue(0);

  // Shift the canvas under diagnostics; leave the Three.js camera alone.
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
        // Modules sheet opens over diagnostics — keep the close-up behind it.
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

  // Deep-link: sheets open a terminal via `dismissTo` + query params.
  useEffect(() => {
    if (!isWatcherId(params.watcher)) return;
    setTalkingTo(params.watcher);
    setIsBonding(false);
    setIsRobotOpen(false);
    setTerminalPage(isWatcherPage(params.page) ? params.page : 'greeting');
    playSfx(
      params.watcher === 'keeper' ? SOUNDS.KEEPER_ON : SOUNDS.OVERSEER_ON,
    );
  }, [params.watcher, params.page]);

  useEffect(() => {
    if (!talkingTo) return;
    void terminalPage;
    playSfx(talkingTo === 'keeper' ? SOUNDS.KEEPER_TALK : SOUNDS.OVERSEER_TALK);
  }, [talkingTo, terminalPage]);

  const navigate = (href: Href) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push(href);
  };

  const leaveTerminal = () => {
    if (talkingTo) {
      playSfx(talkingTo === 'keeper' ? SOUNDS.KEEPER_OFF : SOUNDS.OVERSEER_OFF);
    }
    setTalkingTo(null);
    setTerminalPage('greeting');
  };

  const setWatcherFocus = (watcher: WatcherId | null) => {
    if (watcher) {
      playSfx(watcher === 'keeper' ? SOUNDS.KEEPER_ON : SOUNDS.OVERSEER_ON);
    } else if (talkingTo) {
      playSfx(talkingTo === 'keeper' ? SOUNDS.KEEPER_OFF : SOUNDS.OVERSEER_OFF);
    }
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

    viewBeforeRobot.current = view;

    if (view === 'top') setView(0);

    setIsBonding(true);
    setIsRobotOpen(true);
    playSfx(SOUNDS.DOG_ENTER);
  };

  const setBonding = (next: boolean) => {
    setIsBonding((prev) => {
      if (prev !== next) playSfx(next ? SOUNDS.DOG_ENTER : SOUNDS.DOG_EXIT);
      return next;
    });
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
              tierTotal: PLATFORM_LEVEL_COUNT,
              charge: homeData.robotCharge,
            }}
            onCellPress={(cell) => {
              const key = cellKey(cell);
              const ordinal = lessonOrdinalForKey(key);
              if (ordinal === null) return;
              if (
                !isLessonPlayable(
                  ordinal,
                  doneLessonIds,
                  homeData.platformLevel,
                )
              ) {
                return;
              }
              navigate(DYNAMIC_ROUTES.lesson(key));
            }}
            isAnimated={isMotionEnabled}
            isCameraRig={isCameraRigEnabled}
            isCovered={isArenaCovered}
            onReadyChange={setSceneReady}
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

        {isSceneReady && !talkingTo && !isRobotOpen ? (
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
              bottom={insets.bottom + SPACING.COMPACT}
              onOpen={(watcher, page) => {
                playSfx(
                  watcher === 'keeper' ? SOUNDS.KEEPER_ON : SOUNDS.OVERSEER_ON,
                );
                setTalkingTo(watcher);
                setTerminalPage(page);
                setIsBonding(false);
              }}
              onRobot={openRobot}
              onTrial={(taskId) => navigate(DYNAMIC_ROUTES.task(taskId))}
            />
          </>
        ) : null}

        {talkingTo && currentLine && isSceneReady ? (
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
