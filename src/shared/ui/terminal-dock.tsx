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

import type { TerminalVariant } from '@/shared/constants';
import {
  MAX_CONTENT_WIDTH,
  SPACING,
  TERMINAL_VARIANT,
} from '@/shared/constants';

import { TerminalPanel } from './terminal-panel';

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

/** Bottom terminal capped at `maxShare` so the camera view stays visible. */
export const TerminalDock = ({
  children,
  variant = TERMINAL_VARIANT.KEEPER,
  maxShare = DEFAULT_MAX_SHARE,
  style,
}: TerminalDockProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: insets.bottom + SPACING.TWO }]}
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
  content: { padding: SPACING.THREE },
  frame: {
    flexShrink: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  panel: { flexShrink: 1 },
  root: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingHorizontal: SPACING.TWO,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  // Content-sized until the cap, then it scrolls inside the terminal.
  scroll: { flexGrow: 0, flexShrink: 1 },
});

export type { TerminalDockProps };
