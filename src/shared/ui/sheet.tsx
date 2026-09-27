import { type ReactNode, useEffect } from 'react';

import {
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useMotionEnabled } from '@/shared/model';

import { Text, type TextProps } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `warning` is the amber edge of a decision with a cost — never red. */
type SheetVariant = 'default' | 'warning';

interface SheetRootProps {
  children?: ReactNode;
  variant?: SheetVariant;
  /** Hides the drag handle for sheets that cannot be dismissed by dragging. */
  isGrabberVisible?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface SheetLabelProps {
  /** Machine line over the title — "подтверди", "не хватает 20". */
  children: string;
  variant?: SheetVariant;
}

type SheetTitleProps = TextProps;

type SheetDescriptionProps = TextProps;

interface SheetActionsProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface SheetModalProps {
  children?: ReactNode;
  variant?: SheetVariant;
  isVisible: boolean;
  onClose: () => void;
  /** Disables the drag handle and the tap-outside dismissal. */
  isDismissible?: boolean;
  /** False skips slide timing (animations-off). */
  isAnimated?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;

const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 900;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const SheetLabel = ({ children, variant = 'default' }: SheetLabelProps) => {
  return (
    <Text
      variant="machine"
      themeColor={variant === 'warning' ? 'warning' : 'phosphor'}
    >
      {variant === 'warning' ? `! ${children}` : `> ${children}`}
    </Text>
  );
};

const SheetTitle = ({ children, style, ...props }: SheetTitleProps) => {
  return (
    <Text variant="title" style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
};

const SheetDescription = ({ children, ...props }: SheetDescriptionProps) => {
  return (
    <Text variant="body" themeColor="textSecondary" {...props}>
      {children}
    </Text>
  );
};

/** Actions stack vertically: the safe choice first, the impulse one second. */
const SheetActions = ({ children, style }: SheetActionsProps) => {
  return <View style={[styles.actions, style]}>{children}</View>;
};

const SheetRoot = ({
  children,
  variant = 'default',
  isGrabberVisible = true,
  style,
}: SheetRootProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: variant === 'warning' ? theme.warning : theme.primary,
        },
        style,
      ]}
    >
      {isGrabberVisible && (
        <View
          style={[styles.grabber, { backgroundColor: theme.borderStrong }]}
        />
      )}

      {children}
    </View>
  );
};

/** Unmounts when hidden — stacked Modals under FeedbackHost freeze touch otherwise. */
const SheetModal = ({
  children,
  isVisible,
  onClose,
  isDismissible = true,
  isAnimated = true,
  variant = 'default',
  style,
}: SheetModalProps) => {
  const theme = useTheme();
  const isMotionEnabled = useMotionEnabled();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(windowHeight);
  const sheetHeight = useSharedValue(windowHeight);
  const screenHeight = useSharedValue(windowHeight);

  const shouldAnimate = isAnimated && isMotionEnabled;
  const openMs = shouldAnimate ? OPEN_DURATION : 0;
  const closeMs = shouldAnimate ? CLOSE_DURATION : 0;

  useEffect(() => {
    screenHeight.value = windowHeight;
  }, [screenHeight, windowHeight]);

  useEffect(() => {
    if (!isVisible) return;

    cancelAnimation(offset);
    offset.value = screenHeight.value;
    offset.value = withTiming(0, {
      duration: openMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [isVisible, offset, openMs, screenHeight]);

  const close = () => {
    if (isDismissible) onClose();
  };

  const dragGesture = Gesture.Pan()
    .enabled(isDismissible)
    .activeOffsetY(4)
    .failOffsetX([-20, 20])
    .onChange((event) => {
      offset.value = Math.max(0, offset.value + event.changeY);
    })
    .onEnd((event) => {
      const isDismissed =
        offset.value > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY;

      if (isDismissed) {
        offset.value = withTiming(
          screenHeight.value,
          { duration: closeMs, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
        return;
      }

      offset.value = withTiming(0, {
        duration: closeMs,
        easing: Easing.out(Easing.cubic),
      });
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(offset.value / Math.max(sheetHeight.value, 1), 1),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: theme.overlay },
            overlayStyle,
          ]}
        >
          <Pressable style={styles.scrim} onPress={close} />
        </Animated.View>

        <Animated.View
          onLayout={(event) => {
            sheetHeight.value = event.nativeEvent.layout.height;
          }}
          style={[styles.sheetSlot, sheetStyle]}
        >
          <SheetRoot
            variant={variant}
            isGrabberVisible={false}
            style={[
              styles.attached,
              { paddingBottom: Math.max(insets.bottom, SPACING.THREE) },
              style,
            ]}
          >
            {isDismissible && (
              <GestureDetector gesture={dragGesture}>
                <View style={styles.grabberArea}>
                  <View
                    style={[
                      styles.grabber,
                      { backgroundColor: theme.borderStrong },
                    ]}
                  />
                </View>
              </GestureDetector>
            )}

            {children}
          </SheetRoot>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Sheet = Object.assign(SheetRoot, {
  Label: SheetLabel,
  Title: SheetTitle,
  Description: SheetDescription,
  Actions: SheetActions,
  Modal: SheetModal,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.TWO,
  },
  // Pinned to the bottom edge: only the top carries the lamp-coloured rule.
  attached: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  root: {
    borderRadius: RADII.xl,
    borderWidth: 2,
    gap: SPACING.COMPACT,
    paddingBottom: SPACING.THREE,
    paddingHorizontal: SPACING.THREE,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    borderRadius: RADII.pill,
    height: 4,
    width: 40,
  },
  grabberArea: {
    alignItems: 'center',
    marginTop: -8,
    paddingBottom: 4,
    paddingTop: 8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    flex: 1,
  },
  sheetSlot: {
    alignSelf: 'center',
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
  },
  title: { fontSize: 20, lineHeight: 25 },
});

export type {
  SheetActionsProps,
  SheetDescriptionProps,
  SheetLabelProps,
  SheetModalProps,
  SheetRootProps,
  SheetTitleProps,
  SheetVariant,
};
