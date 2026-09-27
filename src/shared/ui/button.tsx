import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
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

import { FONTS, RADII, SOUNDS, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { playSfx } from '@/shared/lib';
import { useMotionEnabled } from '@/shared/model';
import { isTextOnly } from '@/shared/utils';

import { PixelIcon } from './pixel-icon';
import { Text, type TextProps } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `primary` one filled/screen; `warning` amber irreversible — never red. */
type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'icon'
  | 'stepper'
  | 'warning';
/** `xl` is the lift's button — the one 64-point action in the game. */
type ButtonSize = 'xl' | 'l' | 'm' | 's';

type ButtonLabelProps = Omit<TextProps, 'variant' | 'themeColor'>;

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ButtonContextValue {
  isSystemLink: boolean;
  isStepper: boolean;
  labelColor: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const PRESS_TRAVEL = 2;
const PRESS_IN_DURATION = 60;
const PRESS_OUT_DURATION = 130;
const LOADING_DOTS = [1, 0.6, 0.3];

const SIZE_STYLE: Record<ButtonSize, ViewStyle> = {
  xl: { minHeight: 64, paddingHorizontal: SPACING.THREE },
  l: { minHeight: 56, paddingHorizontal: SPACING.THREE },
  m: { minHeight: 52, paddingHorizontal: SPACING.THREE },
  s: { minHeight: 48, paddingHorizontal: SPACING.TWO },
};

const ButtonContext = createContext<ButtonContextValue | null>(null);

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ButtonLabel = ({ children, style, ...props }: ButtonLabelProps) => {
  const context = useContext(ButtonContext);
  if (!context) throw new Error('Button.Label must be used inside Button');

  return (
    <Text
      variant="bodyBold"
      style={[
        styles.label,
        context.isSystemLink && styles.systemLabel,
        context.isStepper && styles.stepperLabel,
        { color: context.labelColor },
        style,
      ]}
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
  onPress,
  onPressIn,
  onPressOut,
  accessibilityState,
  ...props
}: ButtonProps) => {
  const theme = useTheme();
  const isBlocked = Boolean(disabled) || isLoading;
  const isSystemLink = variant === 'ghost';
  const isSquare = variant === 'icon' || variant === 'stepper';
  const isWarning = variant === 'warning';
  const isOutlined = variant === 'secondary' || isSquare || isWarning;
  const isFilled = !isSystemLink && !isOutlined;
  const offset = useSharedValue(0);
  const isMotionEnabled = useMotionEnabled();
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const labelColorFor = (pressed: boolean) => {
    if (disabled) {
      if (isFilled) return theme.onDisabled;
      if (isSystemLink || variant === 'stepper') return theme.borderStrong;
      return theme.textDisabled;
    }
    if (isFilled) return theme.onAccent;
    if (isSystemLink) return pressed ? theme.phosphor : theme.textMuted;
    if (isWarning) return theme.warning;
    return theme.phosphor;
  };

  const faceColorsFor = (pressed: boolean): ViewStyle => {
    if (isFilled) {
      const fill = disabled
        ? theme.disabled
        : pressed
          ? theme.primaryPressed
          : theme.primary;
      return { backgroundColor: fill, borderColor: fill };
    }
    if (isSystemLink) {
      return {
        backgroundColor: pressed && !disabled ? theme.surface : 'transparent',
        borderColor: 'transparent',
      };
    }
    if (disabled) {
      return { backgroundColor: 'transparent', borderColor: theme.border };
    }
    if (isWarning) {
      return {
        backgroundColor: pressed ? theme.warningSoft : 'transparent',
        borderColor: theme.warning,
      };
    }
    return {
      backgroundColor: pressed ? theme.surfaceSoft : 'transparent',
      borderColor: pressed
        ? theme.phosphor
        : variant === 'icon'
          ? theme.border
          : theme.borderStrong,
    };
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    offset.value = withTiming(isFilled ? PRESS_TRAVEL : 0, {
      duration: isMotionEnabled ? PRESS_IN_DURATION : 0,
      easing: Easing.out(Easing.quad),
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    offset.value = withTiming(0, {
      duration: isMotionEnabled ? PRESS_OUT_DURATION : 0,
      easing: Easing.out(Easing.quad),
    });
    onPressOut?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: isLoading,
        disabled: isBlocked,
      }}
      disabled={isBlocked}
      onPress={(event) => {
        if (!isBlocked) {
          if (variant === 'ghost') playSfx(SOUNDS.UI_BACK);
          else if (variant === 'primary' || variant === 'warning')
            playSfx(SOUNDS.UI_CONFIRM);
          else playSfx(SOUNDS.UI_TAP);
        }
        onPress?.(event);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.root, isFullWidth && styles.fullWidth, style]}
      {...props}
    >
      {({ pressed }) => {
        const labelColor = labelColorFor(pressed);
        return (
          <Animated.View
            style={[
              styles.face,
              SIZE_STYLE[size],
              isSquare && styles.square,
              isSystemLink && styles.systemLink,
              faceStyle,
              faceColorsFor(pressed),
              (isWarning || (disabled && variant === 'secondary')) &&
                styles.dashed,
            ]}
          >
            <ButtonContext.Provider
              value={{
                isSystemLink,
                isStepper: variant === 'stepper',
                labelColor,
              }}
            >
              {isLoading ? (
                <View style={styles.content}>
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
                <View style={styles.content}>
                  {disabled &&
                    isTextOnly(children) &&
                    !isSystemLink &&
                    !isSquare && (
                      <PixelIcon name="lock" size={12} color={labelColor} />
                    )}
                  {isSystemLink && isTextOnly(children) ? (
                    <ButtonLabel>[ {children} ]</ButtonLabel>
                  ) : (
                    Children.toArray(children).map((child, index) =>
                      isValidElement(child) ? (
                        child
                      ) : (
                        <ButtonLabel key={index}>{child}</ButtonLabel>
                      ),
                    )
                  )}
                </View>
              )}
            </ButtonContext.Provider>
          </Animated.View>
        );
      }}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Button = Object.assign(ButtonRoot, { Label: ButtonLabel });

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: SPACING.TWO,
    justifyContent: 'center',
  },
  dashed: { borderStyle: 'dashed' },
  dot: { height: 6, width: 6 },
  face: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    justifyContent: 'center',
    paddingVertical: SPACING.TWO,
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  label: { flexShrink: 1, textAlign: 'center' },
  root: { alignSelf: 'flex-start' },
  square: {
    borderRadius: RADII.s,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 48,
  },
  stepperLabel: { fontFamily: FONTS.sans, fontSize: 22, lineHeight: 28 },
  systemLabel: { fontFamily: FONTS.mono, fontSize: 14, lineHeight: 20 },
  systemLink: { borderRadius: RADII.s, minHeight: 48 },
});

export type { ButtonLabelProps, ButtonProps, ButtonSize, ButtonVariant };
