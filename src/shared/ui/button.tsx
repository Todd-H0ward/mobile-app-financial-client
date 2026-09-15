import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RADII, SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { hitSlopFor, isTextOnly } from '@/shared/utils';

import { Text, type TextProps, type TextVariant } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type ButtonVariant = 'primary' | 'accent' | 'success' | 'secondary' | 'ghost';
type ButtonSize = 'l' | 'm' | 's';

type ButtonLabelProps = Omit<TextProps, 'variant' | 'themeColor'>;

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

type ButtonContextValue = {
  size: ButtonSize;
  labelColor: string;
};

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PRESS_TRAVEL_RATIO = 0.75;
const LOADING_DOTS = [1, 0.6, 0.3];

const PRESS_IN_DURATION = 60;
const PRESS_OUT_DURATION = 130;

const LABEL_VARIANT: Record<ButtonSize, TextVariant> = {
  l: 'subtitle',
  m: 'bodyBold',
  // Size S is still actionable content — 16sp floor, not a caption (3.6).
  s: 'bodyBold',
};

/** Visual height of size S; hitSlop expands the target to HIT_SLOP_SIZE. */
const SIZE_S_HEIGHT = 40;

const SHADOW_HEIGHT: Record<ButtonSize, number> = {
  l: 4,
  m: 3,
  s: 0,
};

const SIZE_STYLE: Record<ButtonSize, ViewStyle> = {
  l: {
    borderRadius: RADII.l,
    minHeight: 56,
    paddingHorizontal: 20,
  },
  m: {
    borderRadius: RADII.m,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  s: {
    borderRadius: RADII.s,
    minHeight: SIZE_S_HEIGHT,
    paddingHorizontal: 14,
  },
};

const VARIANT_COLORS: Record<
  ButtonVariant,
  {
    base: ThemeColor;
    pressed: ThemeColor;
    shadow?: ThemeColor;
    label: ThemeColor;
  }
> = {
  primary: {
    base: 'primary',
    pressed: 'primaryPressed',
    shadow: 'primaryShadow',
    label: 'inverseText',
  },
  accent: {
    base: 'accent',
    pressed: 'accentPressed',
    shadow: 'accentShadow',
    label: 'inverseText',
  },
  success: {
    base: 'success',
    pressed: 'successPressed',
    shadow: 'successShadow',
    label: 'inverseText',
  },
  secondary: { base: 'surface', pressed: 'surfaceDeep', label: 'text' },
  ghost: { base: 'background', pressed: 'surfaceDeep', label: 'text' },
};

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

const ButtonContext = createContext<ButtonContextValue | null>(null);

const useButtonContext = () => {
  const context = useContext(ButtonContext);

  if (!context) {
    throw new Error('Component must be used within Button.Provider');
  }

  return context;
};

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

const ButtonLabel = ({ children, style, ...props }: ButtonLabelProps) => {
  const context = useButtonContext();

  return (
    <Text
      variant={LABEL_VARIANT[context.size]}
      style={[styles.label, { color: context.labelColor }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const ButtonRoot = ({
  children,
  variant = 'primary',
  size = 'l',
  isLoading = false,
  isFullWidth = false,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) => {
  const theme = useTheme();
  const colors = VARIANT_COLORS[variant];
  const shadowHeight = SHADOW_HEIGHT[size];
  const isBlocked = Boolean(disabled) || isLoading;
  const isOutlined = variant === 'secondary' || variant === 'ghost';

  /** Outlined variants and size S have no shadow: they only change color. */
  const hasShadow = colors.shadow != null && shadowHeight > 0;

  const labelColor = isBlocked ? theme.onDisabled : theme[colors.label];
  const radius = SIZE_STYLE[size].borderRadius;

  const travel = hasShadow ? shadowHeight * PRESS_TRAVEL_RATIO : 0;
  const offset = useSharedValue(0);

  const contextValue = useMemo<ButtonContextValue>(
    () => ({ size, labelColor }),
    [size, labelColor],
  );

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    offset.value = withTiming(travel, {
      duration: PRESS_IN_DURATION,
      easing: Easing.out(Easing.quad),
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    offset.value = withTiming(0, {
      duration: PRESS_OUT_DURATION,
      easing: Easing.out(Easing.quad),
    });
    onPressOut?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isBlocked }}
      disabled={isBlocked}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.root,
        isFullWidth && styles.fullWidth,
        { paddingBottom: hasShadow ? shadowHeight : 0 },
        style,
      ]}
      {...props}
      // Size S is 40dp visually; hitSlop is required so the target stays ≥ 48.
      hitSlop={
        size === 's' ? hitSlopFor(SIZE_S_HEIGHT) : (props.hitSlop ?? undefined)
      }
    >
      {({ pressed }) => (
        <>
          {hasShadow && !isBlocked && colors.shadow != null && (
            <View
              style={[
                styles.shadow,
                {
                  backgroundColor: theme[colors.shadow],
                  borderRadius: radius,
                  top: shadowHeight,
                },
              ]}
            />
          )}

          <Animated.View
            style={[
              styles.face,
              SIZE_STYLE[size],
              faceStyle,
              {
                backgroundColor: isBlocked
                  ? theme.disabled
                  : theme[pressed ? colors.pressed : colors.base],
              },
              isOutlined && {
                borderColor: isBlocked ? theme.border : theme.borderStrong,
                borderWidth: 2,
              },
            ]}
          >
            {isLoading ? (
              <View style={styles.dots}>
                {LOADING_DOTS.map((opacity) => (
                  <View
                    key={opacity}
                    style={[
                      styles.dot,
                      { backgroundColor: labelColor, opacity },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <ButtonContext.Provider value={contextValue}>
                {isTextOnly(children) ? (
                  <ButtonLabel>{children}</ButtonLabel>
                ) : (
                  <View style={styles.content}>
                    {/* Loose text beside an icon still needs its own <Text>. */}
                    {Children.toArray(children).map((child, index) =>
                      isValidElement(child) ? (
                        child
                      ) : (
                        <ButtonLabel key={index}>{child}</ButtonLabel>
                      ),
                    )}
                  </View>
                )}
              </ButtonContext.Provider>
            )}
          </Animated.View>
        </>
      )}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Button = Object.assign(ButtonRoot, {
  Label: ButtonLabel,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  shadow: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  label: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    borderRadius: RADII.pill,
    height: 8,
    width: 8,
  },
});

export type { ButtonLabelProps, ButtonProps, ButtonSize, ButtonVariant };
