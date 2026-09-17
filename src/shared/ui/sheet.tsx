import { type ReactNode, useEffect, useState } from 'react';

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
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text, type TextProps } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface SheetRootProps {
  children?: ReactNode;
  /** Hides the drag handle for sheets that cannot be dismissed by dragging. */
  isGrabberVisible?: boolean;
  style?: StyleProp<ViewStyle>;
}

type SheetTitleProps = TextProps;

type SheetDescriptionProps = TextProps;

interface SheetActionsProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface SheetModalProps {
  children?: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  /** Disables the drag handle and the tap-outside dismissal. */
  isDismissible?: boolean;
  /**
   * When false, the sheet appears and disappears without slide timing —
   * for the grown-up's "animations off" switch. Defaults to true.
   */
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

const SheetTitle = ({ children, ...props }: SheetTitleProps) => {
  return (
    <Text variant="subtitle" style={styles.centered} {...props}>
      {children}
    </Text>
  );
};

const SheetDescription = ({ children, ...props }: SheetDescriptionProps) => {
  return (
    <Text themeColor="textSecondary" style={styles.centered} {...props}>
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
  isGrabberVisible = true,
  style,
}: SheetRootProps) => {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }, style]}>
      {isGrabberVisible && (
        <View
          style={[styles.grabber, { backgroundColor: theme.surfaceDeep }]}
        />
      )}

      {children}
    </View>
  );
};

const SheetModal = ({
  children,
  isVisible,
  onClose,
  isDismissible = true,
  isAnimated = true,
  style,
}: SheetModalProps) => {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(isVisible);
  const offset = useSharedValue(windowHeight);
  const height = useSharedValue(windowHeight);

  const openMs = isAnimated ? OPEN_DURATION : 0;
  const closeMs = isAnimated ? CLOSE_DURATION : 0;

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      offset.value = windowHeight;
      offset.value = withTiming(0, {
        duration: openMs,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    offset.value = withTiming(
      windowHeight,
      { duration: closeMs, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      },
    );
  }, [closeMs, isVisible, offset, openMs, windowHeight]);

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
          windowHeight,
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
    opacity: 1 - Math.min(offset.value / height.value, 1),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  if (!isMounted) return null;

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
            height.value = event.nativeEvent.layout.height;
          }}
          style={[styles.sheetSlot, sheetStyle]}
        >
          <SheetRoot isGrabberVisible={false} style={style}>
            {isDismissible && (
              <GestureDetector gesture={dragGesture}>
                <View style={styles.grabberArea}>
                  <View
                    style={[
                      styles.grabber,
                      { backgroundColor: theme.surfaceDeep },
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
  Title: SheetTitle,
  Description: SheetDescription,
  Actions: SheetActions,
  Modal: SheetModal,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: RADII.xxl,
    gap: SPACING.three,
    padding: SPACING.four,
  },
  grabber: {
    alignSelf: 'center',
    borderRadius: RADII.pill,
    height: 5,
    width: 36,
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
    padding: SPACING.two,
  },
  centered: {
    textAlign: 'center',
  },
  actions: {
    gap: SPACING.two,
  },
});

export type {
  SheetActionsProps,
  SheetDescriptionProps,
  SheetModalProps,
  SheetRootProps,
  SheetTitleProps,
};
