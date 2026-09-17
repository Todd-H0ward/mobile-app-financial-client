import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ConsoleDeviceProps {
  /** Content drawn inside the LCD well (lobby list or a game field). */
  children: ReactNode;
  /** Optional row under the screen (D-pad / face buttons). */
  controls?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Handheld chrome: plastic shell, dark LCD well, optional controls.
 * Fills the parent height — the screen slot grows, controls stay at the bottom.
 */
export const ConsoleDevice = ({
  children,
  controls,
  style,
}: ConsoleDeviceProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.arcadeShell,
          borderColor: theme.arcadeShellDeep,
          // Soft plastic lip under the shell.
          shadowColor: theme.arcadeShellDeep,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.highlight,
          { backgroundColor: theme.arcadeShellHighlight },
        ]}
      />

      <View
        style={[
          styles.bezel,
          {
            backgroundColor: theme.arcadeShellDeep,
            borderColor: theme.arcadeShellHighlight,
          },
        ]}
      >
        <View
          style={[
            styles.screen,
            {
              backgroundColor: theme.arcadeScreen,
              borderColor: theme.arcadeScreenGlow,
            },
          ]}
        >
          {children}
        </View>
      </View>

      {controls != null ? (
        <View style={styles.controls}>{controls}</View>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  bezel: {
    borderRadius: RADII.xl,
    borderWidth: 2,
    flex: 1,
    minHeight: 0,
    padding: SPACING.two,
  },
  controls: {
    flexShrink: 0,
    marginTop: SPACING.three,
  },
  highlight: {
    alignSelf: 'center',
    borderRadius: RADII.pill,
    height: 4,
    marginBottom: SPACING.two,
    opacity: 0.55,
    width: '36%',
  },
  root: {
    borderBottomWidth: 5,
    borderRadius: RADII.xxxl,
    borderWidth: 3,
    elevation: 8,
    flex: 1,
    minHeight: 0,
    padding: SPACING.three,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  screen: {
    borderRadius: RADII.l,
    borderWidth: 2,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    padding: SPACING.two,
  },
});

export type { ConsoleDeviceProps };
