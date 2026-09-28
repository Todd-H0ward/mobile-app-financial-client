import { type ReactNode, useId, useMemo } from 'react';

import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { TerminalVariant } from '@/shared/constants';
import { COLORS, RADII, SPACING, TERMINAL_VARIANT } from '@/shared/constants';
import {
  paletteForVoice,
  TerminalPaletteProvider,
  useColorScheme,
  useTheme,
} from '@/shared/hooks';
import { useMotionEnabled, useTextureEnabled } from '@/shared/model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `l` a full terminal, `m` a docked card or the action bar, `s` the HUD board. */
type TerminalSize = 'l' | 'm' | 's';
interface TerminalPanelProps {
  children?: ReactNode;
  variant?: TerminalVariant;
  size?: TerminalSize;
  /** The LED strip on the bezel says whose terminal it is. */
  isLampVisible?: boolean;
  isTextureEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
  frameStyle?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SIZE_STYLES: Record<
  TerminalSize,
  { frame: ViewStyle; screen: ViewStyle; lamp: ViewStyle }
> = {
  l: {
    frame: { borderRadius: RADII.xxl, padding: SPACING.TWO },
    screen: { borderRadius: RADII.xl },
    lamp: { height: 3, top: 2, width: 48 },
  },
  m: {
    frame: { borderRadius: 18, padding: 5 },
    screen: { borderRadius: RADII.m },
    lamp: { height: 3, top: 1, width: 40 },
  },
  s: {
    frame: { borderRadius: RADII.m, padding: SPACING.ONE },
    screen: { borderRadius: RADII.s },
    lamp: { height: 2, top: 1, width: 32 },
  },
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Static texture is behind content, so text and touch targets stay clear. */
export const TerminalPanel = ({
  children,
  variant,
  size = 'l',
  isLampVisible = true,
  isTextureEnabled,
  style,
  frameStyle,
}: TerminalPanelProps) => {
  const scheme = useColorScheme();
  const outerTheme = useTheme();
  // Voice tint only when the panel is a watcher's screen — HUD boards omit variant
  // and keep the base green field.
  const voicePalette =
    variant === TERMINAL_VARIANT.KEEPER || variant === TERMINAL_VARIANT.OVERSEER
      ? paletteForVoice(variant)
      : null;
  // Own chrome uses the voice field even when nested; children read it via context.
  const theme = useMemo(
    () => (voicePalette ? { ...COLORS[scheme], ...voicePalette } : outerTheme),
    [outerTheme, scheme, voicePalette],
  );
  const isMotionEnabled = useMotionEnabled();
  const isTexturePreferred = useTextureEnabled();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hasTexture =
    isMotionEnabled && (isTextureEnabled ?? isTexturePreferred);
  const lamp =
    variant === TERMINAL_VARIANT.OVERSEER
      ? theme.overseerLcd
      : variant === TERMINAL_VARIANT.ADULT
        ? theme.borderStrong
        : theme.phosphor;

  const screen = (
    <View
      style={[
        styles.root,
        SIZE_STYLES[size].frame,
        { backgroundColor: theme.bezel },
        frameStyle,
      ]}
    >
      {isLampVisible ? (
        <View
          pointerEvents="none"
          style={[
            styles.lamp,
            SIZE_STYLES[size].lamp,
            {
              backgroundColor: lamp,
              marginLeft: -Number(SIZE_STYLES[size].lamp.width) / 2,
              shadowColor: lamp,
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.screen,
          SIZE_STYLES[size].screen,
          { backgroundColor: theme.terminalScreen },
          style,
        ]}
      >
        {hasTexture ? (
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            {...(Platform.OS === 'web'
              ? { 'aria-hidden': true }
              : {
                  accessible: false,
                  accessibilityElementsHidden: true,
                  importantForAccessibility: 'no-hide-descendants' as const,
                })}
          >
            <Defs>
              <Pattern
                id={`scan${id}`}
                width={4}
                height={4}
                patternUnits="userSpaceOnUse"
              >
                <Rect width={4} height={1} fill={theme.scanline} />
              </Pattern>
              <RadialGradient
                id={`edge${id}`}
                cx="50%"
                cy="45%"
                rx="70%"
                ry="70%"
              >
                <Stop
                  offset="55%"
                  stopColor={theme.surfaceDeep}
                  stopOpacity={0}
                />
                <Stop
                  offset="100%"
                  stopColor={theme.surfaceDeep}
                  stopOpacity={0.7}
                />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#scan${id})`} />
            <Rect width="100%" height="100%" fill={`url(#edge${id})`} />
          </Svg>
        ) : null}
        {children}
      </View>
    </View>
  );

  if (!voicePalette) return screen;

  return (
    <TerminalPaletteProvider value={voicePalette}>
      {screen}
    </TerminalPaletteProvider>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  lamp: {
    borderRadius: 2,
    left: '50%',
    position: 'absolute',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    zIndex: 1,
  },
  root: {
    minHeight: 0,
  },
  screen: {
    flexGrow: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export type { TerminalPanelProps, TerminalSize, TerminalVariant };
