import { type ReactNode, useEffect, useState } from 'react';

import {
  Dimensions,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
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

import { RADII } from '@/shared/constants';
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
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  style,
}: SheetModalProps) => {
  const theme = useTheme();
  const [isMounted, setIsMounted] = useState(isVisible);
  const offset = useSharedValue(SCREEN_HEIGHT);
  const height = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      offset.value = SCREEN_HEIGHT;
      offset.value = withTiming(0, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    offset.value = withTiming(
      SCREEN_HEIGHT,
      { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      },
    );
  }, [isVisible, offset]);

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
          SCREEN_HEIGHT,
          { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
        return;
      }

      offset.value = withTiming(0, {
        duration: CLOSE_DURATION,
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
    gap: 14,
    padding: 20,
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
    padding: 8,
  },
  centered: {
    textAlign: 'center',
  },
  actions: {
    gap: 8,
  },
});

export type {
  SheetActionsProps,
  SheetDescriptionProps,
  SheetModalProps,
  SheetRootProps,
  SheetTitleProps,
};
