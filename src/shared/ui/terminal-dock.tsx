import type { ReactNode } from 'react';

import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, SPACING } from '@/shared/constants';

import { TerminalPanel, type TerminalVariant } from './terminal-panel';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TerminalDockProps {
  children?: ReactNode;
  variant?: TerminalVariant;
  /** Highest the dock may climb, as a share of the window height, 0…1. */
  maxShare?: number;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const DEFAULT_MAX_SHARE = 0.54;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * A terminal docked to the bottom of the game, as tall as its content and
 * never above `maxShare` — whatever the camera looks at above stays in view.
 * Longer content scrolls inside the screen.
 */
export const TerminalDock = ({
  children,
  variant = 'keeper',
  maxShare = DEFAULT_MAX_SHARE,
  style,
}: TerminalDockProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: insets.bottom + SPACING.two }]}
    >
      <TerminalPanel
        variant={variant}
        frameStyle={[styles.frame, { maxHeight: height * maxShare }]}
        style={styles.panel}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </TerminalPanel>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  content: { padding: SPACING.three },
  frame: {
    flexShrink: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.three,
    width: '100%',
  },
  panel: { flexShrink: 1 },
  root: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingHorizontal: SPACING.two,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  // Content-sized until the cap, then it scrolls inside the terminal.
  scroll: { flexGrow: 0, flexShrink: 1 },
});

export type { TerminalDockProps };
