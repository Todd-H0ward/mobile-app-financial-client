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

import { CONTENT_PADDING, SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { useMotionEnabled } from '@/shared/model';

import { useWatcherSession } from '../model';

import { ArcadePage } from './pages/arcade-page';
import { GreetingPage } from './pages/greeting-page';
import { JarPage } from './pages/jar-page';
import { PlanPage } from './pages/plan-page';
import { ReportPage } from './pages/report-page';
import { ShopPage } from './pages/shop-page';
import { TrialsPage } from './pages/trials-page';
import { TerminalShell } from './terminal-shell';

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
const COLLAPSED_HEIGHT_RATIO = 0.42;
const COLLAPSED_MAX_HEIGHT = 420;
/** How long the CRT grows / shrinks. */
const EXPAND_MS = 340;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const subtitleFor = (
  watcher: WatcherId,
  page: WatcherPageId,
  t: (key: string) => string,
): string => {
  if (page === 'greeting') {
    return t(`watcher.terminal.subtitle.${watcher}`);
  }
  return t(`watcher.terminal.subtitle.${page}`);
};

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
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isMotionEnabled = useMotionEnabled();
  const session = useWatcherSession(initialPage);
  const isExpanded = session.page !== 'greeting';

  const collapsedHeight = Math.min(
    windowHeight * COLLAPSED_HEIGHT_RATIO,
    COLLAPSED_MAX_HEIGHT,
  );
  const expandedTop = insets.top + SPACING.one;
  const expandedHeight = Math.max(
    collapsedHeight,
    windowHeight - expandedTop - SPACING.one,
  );
  const collapsedTop = windowHeight - collapsedHeight;

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
    const side = CONTENT_PADDING + (SPACING.one - CONTENT_PADDING) * progress;
    return {
      top,
      height,
      left: side,
      right: side,
      paddingBottom: SPACING.two + insets.bottom * (1 - progress * 0.4),
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

  const title = t('watcher.terminal.onAir', {
    name: t(`scene.watchers.${watcher}.name`),
  });

  let body = <GreetingPage line={line} onAction={handleAction} />;

  if (session.page === 'plan') {
    body = <PlanPage onDone={session.backToGreeting} />;
  } else if (session.page === 'shop') {
    body = <ShopPage onBack={session.backToGreeting} />;
  } else if (session.page === 'jar') {
    body = <JarPage onBack={session.backToGreeting} />;
  } else if (session.page === 'report') {
    body = <ReportPage onBack={session.backToGreeting} />;
  } else if (session.page === 'trials') {
    body = <TrialsPage onBack={session.backToGreeting} />;
  } else if (session.page === 'arcade') {
    body = <ArcadePage onBack={session.backToGreeting} />;
  }

  return (
    <Animated.View style={[styles.dock, dockStyle]} pointerEvents="box-none">
      <TerminalShell
        watcher={watcher}
        title={title}
        subtitle={subtitleFor(watcher, session.page, t)}
        onLeave={onLeave}
      >
        {body}
      </TerminalShell>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    zIndex: 3,
  },
});
