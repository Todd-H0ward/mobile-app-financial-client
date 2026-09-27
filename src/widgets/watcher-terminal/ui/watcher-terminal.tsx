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

import {
  CONTENT_PADDING,
  MAX_CONTENT_WIDTH,
  SPACING,
} from '@/shared/constants';
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

/** Greeting dock — face stays visible above. */
const COLLAPSED_HEIGHT_RATIO = 0.48;
const COLLAPSED_MAX_HEIGHT = 480;
/** How long the CRT grows / shrinks. */
const EXPAND_MS = 340;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * CRT panel under the focused AI face.
 *
 * Greeting sits in the lower band so the face stays visible. Opening plan /
 * shop / trials grows the panel to fill the screen; back to greeting shrinks
 * it again.
 */
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
  const isExpanded = session.page !== 'greeting';

  const collapsedHeight = Math.min(
    windowHeight * (fontScale > 1.3 ? 0.65 : COLLAPSED_HEIGHT_RATIO),
    COLLAPSED_MAX_HEIGHT,
  );
  const expandedTop = insets.top + Math.min(120, windowHeight * 0.18);
  const expandedHeight = Math.max(
    collapsedHeight,
    windowHeight - expandedTop - SPACING.one,
  );
  const collapsedTop = windowHeight - collapsedHeight;
  const side = Math.max(SPACING.two, (windowWidth - MAX_CONTENT_WIDTH) / 2);

  const expand = useSharedValue(initialPage === 'greeting' ? 0 : 1);

  useEffect(() => {
    expand.value = withTiming(isExpanded ? 1 : 0, {
      duration: isMotionEnabled ? EXPAND_MS : 0,
      easing: Easing.out(Easing.cubic),
    });
  }, [expand, isExpanded, isMotionEnabled]);

  const dockStyle = useAnimatedStyle(() => {
    const progress = expand.value;
    const top = collapsedTop + (expandedTop - collapsedTop) * progress;
    const height =
      collapsedHeight + (expandedHeight - collapsedHeight) * progress;
    const inset =
      Math.max(CONTENT_PADDING, side) +
      (side - Math.max(CONTENT_PADDING, side)) * progress;
    return {
      top,
      height,
      left: inset,
      right: inset,
      paddingBottom: SPACING.two + insets.bottom,
      paddingTop: SPACING.two,
    };
  });

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
      style={[styles.root, dockStyle]}
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
  root: {
    position: 'absolute',
    zIndex: 3,
  },
});
