import { useEffect } from 'react';

import { type Href, useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  WatcherDialogAction,
  WatcherId,
  WatcherLine,
  WatcherPageId,
} from '@/entities/watcher';

import { MAX_CONTENT_WIDTH, SPACING } from '@/shared/constants';
import { useMotionEnabled } from '@/shared/model';

import { useWatcherSession } from '../model';

import { ArcadePage } from './pages/arcade-page';
import { GreetingPage } from './pages/greeting-page';
import { JarPage } from './pages/jar-page';
import { PlanPage } from './pages/plan-page';
import { ReportPage } from './pages/report-page';
import { ShopPage } from './pages/shop-page';
import { TrialsPage } from './pages/trials-page';
import type { TerminalFrame } from './terminal-shell';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface WatcherTerminalProps {
  watcher: WatcherId;
  line: WatcherLine;
  /** Optional deep-link into a page (shop / plan from old routes). */
  initialPage?: WatcherPageId;
  onLeave: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * The greeting is a dialogue: the panel never climbs above this share of the window, so
 * the watcher's face stays in view above its line.
 */
const DIALOGUE_MAX_SHARE = 0.56;
/**
 * A page (plan, shop, …) is a form and may rise nearly to the top — the status board hides
 * during a talk — so nothing is hidden.
 */
const PAGE_TOP_CLEARANCE = 48;
/** How far the panel rises from as it appears. */
const ENTER_OFFSET = 48;
const ENTER_MS = 280;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** CRT panel under the focused AI face. */
export const WatcherTerminal = ({
  watcher,
  line,
  initialPage = 'greeting',
  onLeave,
}: WatcherTerminalProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    height: windowHeight,
    width: windowWidth,
    fontScale,
  } = useWindowDimensions();
  const isMotionEnabled = useMotionEnabled();
  const session = useWatcherSession(initialPage);
  const isDialogue = session.page === 'greeting';

  const pageMaxHeight =
    windowHeight - insets.top - PAGE_TOP_CLEARANCE - insets.bottom;
  const maxHeight = isDialogue
    ? Math.min(
        pageMaxHeight,
        windowHeight * (fontScale > 1.3 ? 0.72 : DIALOGUE_MAX_SHARE),
      )
    : pageMaxHeight;
  const side = Math.max(
    SPACING.TWO,
    (windowWidth - MAX_CONTENT_WIDTH - SPACING.THREE) / 2,
  );

  // Rises from the bottom edge once, as the talk starts.
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, {
      duration: isMotionEnabled ? ENTER_MS : 0,
      easing: Easing.out(Easing.cubic),
    });
  }, [enter, isMotionEnabled]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * ENTER_OFFSET }],
  }));

  const handleAction = (action: WatcherDialogAction) => {
    if (action.kind === 'page') {
      session.open(action.page);
      return;
    }
    router.push(action.route as Href);
  };

  const frame: TerminalFrame = {
    watcher,
    onLeave,
    onBack: session.page === 'greeting' ? undefined : session.backToGreeting,
  };

  let body = <GreetingPage frame={frame} line={line} onAction={handleAction} />;

  if (session.page === 'plan') {
    body = <PlanPage frame={frame} onDone={session.backToGreeting} />;
  } else if (session.page === 'shop') {
    body = <ShopPage frame={frame} />;
  } else if (session.page === 'jar') {
    body = <JarPage frame={frame} />;
  } else if (session.page === 'report') {
    body = <ReportPage frame={frame} />;
  } else if (session.page === 'trials') {
    body = <TrialsPage frame={frame} onArcade={() => session.open('arcade')} />;
  } else if (session.page === 'arcade') {
    body = <ArcadePage frame={frame} />;
  }

  return (
    <Animated.View
      style={[
        styles.root,
        enterStyle,
        {
          left: side,
          maxHeight: maxHeight + insets.bottom + SPACING.TWO,
          paddingBottom: insets.bottom + SPACING.TWO,
          right: side,
        },
      ]}
      pointerEvents="box-none"
      accessibilityViewIsModal
    >
      {body}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  // Anchored to the bottom edge and as tall as its content — a short line leaves no empty
  // terminal, a long page scrolls inside it.
  root: {
    bottom: 0,
    position: 'absolute',
    zIndex: 3,
  },
});
