import { type ReactNode, useId } from 'react';

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

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useGlassEnabled, useMotionEnabled } from '@/shared/model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TerminalVariant = 'keeper' | 'overseer' | 'adult';
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
    frame: { borderRadius: RADII.xxl, padding: SPACING.two },
    screen: { borderRadius: RADII.xl },
    lamp: { height: 3, top: 2, width: 48 },
  },
  m: {
    frame: { borderRadius: 18, padding: 5 },
    screen: { borderRadius: RADII.m },
    lamp: { height: 3, top: 1, width: 40 },
  },
  s: {
    frame: { borderRadius: RADII.m, padding: SPACING.one },
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
  variant = 'keeper',
  size = 'l',
  isLampVisible = true,
  isTextureEnabled,
  style,
  frameStyle,
}: TerminalPanelProps) => {
  const theme = useTheme();
  const isMotionEnabled = useMotionEnabled();
  const isTexturePreferred = useGlassEnabled();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hasTexture =
    isMotionEnabled && (isTextureEnabled ?? isTexturePreferred);
  const lamp =
    variant === 'overseer'
      ? theme.overseerLcd
      : variant === 'adult'
        ? theme.borderStrong
        : theme.phosphor;

  return (
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
