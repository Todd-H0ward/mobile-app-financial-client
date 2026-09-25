import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  CONTENT_PADDING,
  MAX_CONTENT_WIDTH,
  RADII,
  SPACING,
  type Spacing,
  STATIC_ROUTES,
  type ThemeColor,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { hitSlopFor } from '@/shared/utils';

import { Text, type TextProps } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ScreenRootProps {
  children?: ReactNode;
  variant?: ThemeColor;
  gap?: Spacing;
  /**
   * When false, the screen does not wrap children in a `ScrollView` — use this
   * when a child owns scrolling (`FlatList`), so lists stay virtualized.
   */
  isScrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ScreenBackProps {
  tone?: ThemeColor;
  color?: ThemeColor;
  accessibilityLabel?: string;
}

/**
 * The header is a row: an optional leading control, the heading, an optional
 * trailing one. Children are laid out in the order they are written, so the
 * arrangement is readable at the call site instead of hidden behind slots.
 */
interface ScreenHeaderProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface ScreenHeadingProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

type ScreenTitleProps = TextProps;

type ScreenSubtitleProps = TextProps;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the back control; hitSlop expands it to HIT_SLOP_SIZE. */
const BACK_SIZE = 40;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ScreenBack = ({
  tone = 'surface',
  color = 'text',
  accessibilityLabel,
}: ScreenBackProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t('common.back')}
      hitSlop={hitSlopFor(BACK_SIZE)}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace(STATIC_ROUTES.ENTRY);
      }}
      style={({ pressed }) => [
        styles.back,
        {
          backgroundColor: theme[tone],
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text variant="subtitle" themeColor={color}>
        ‹
      </Text>
    </Pressable>
  );
};

const ScreenTitle = ({
  children,
  variant = 'title',
  themeColor = 'text',
  numberOfLines = 1,
  ...props
}: ScreenTitleProps) => (
  <Text
    variant={variant}
    themeColor={themeColor}
    numberOfLines={numberOfLines}
    {...props}
  >
    {children}
  </Text>
);

const ScreenSubtitle = ({
  children,
  variant = 'small',
  themeColor = 'textMuted',
  ...props
}: ScreenSubtitleProps) => (
  <Text variant={variant} themeColor={themeColor} {...props}>
    {children}
  </Text>
);

const ScreenHeading = ({ children, style }: ScreenHeadingProps) => (
  <View style={[styles.heading, style]}>{children}</View>
);

const ScreenHeader = ({ children, style }: ScreenHeaderProps) => (
  <View style={[styles.header, style]}>{children}</View>
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const ScreenRoot = ({
  children,
  variant = 'background',
  gap = 'two',
  isScrollable = true,
  style,
}: ScreenRootProps) => {
  // The bottom edge stays off `SafeAreaView` on purpose: padding it there would
  // clip the scroll view instead of letting content scroll past the indicator.
  // It goes on the scroll content with the home-indicator inset.
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + SPACING.four;

  const column = (
    <View
      style={[
        styles.column,
        !isScrollable && styles.columnFill,
        { gap: SPACING[gap] },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <ThemedView variant={variant} style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isScrollable ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: bottomPad },
            ]}
          >
            {column}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              styles.static,
              { paddingBottom: bottomPad },
            ]}
          >
            {column}
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Screen = Object.assign(ScreenRoot, {
  Back: ScreenBack,
  Header: ScreenHeader,
  Heading: ScreenHeading,
  Title: ScreenTitle,
  Subtitle: ScreenSubtitle,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  back: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 1,
    height: BACK_SIZE,
    justifyContent: 'center',
    width: BACK_SIZE,
  },
  column: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    flexGrow: 1,
  },
  columnFill: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: SPACING.three,
    flexGrow: 1,
  },
  static: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
    gap: 2,
  },
  safeArea: {
    flex: 1,
  },
});

export type {
  ScreenBackProps,
  ScreenHeaderProps,
  ScreenHeadingProps,
  ScreenRootProps,
  ScreenSubtitleProps,
  ScreenTitleProps,
};
