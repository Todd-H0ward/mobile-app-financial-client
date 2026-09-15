import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
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
  BOTTOM_TAB_INSET,
  CONTENT_PADDING,
  MAX_CONTENT_WIDTH,
  RADII,
  SPACING,
  type Spacing,
  type ThemeColor,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { hitSlopFor } from '@/shared/utils';

import { Text } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ScreenRootProps {
  children?: ReactNode;
  variant?: ThemeColor;
  gap?: Spacing;
  /** Leaves room for the tab bar. Off for pushed screens. */
  isTabBarVisible?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ScreenBackProps {
  tone?: ThemeColor;
  color?: ThemeColor;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  titleColor?: ThemeColor;
  subtitleColor?: ThemeColor;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the back control; hitSlop expands it to HIT_SLOP_SIZE. */
const BACK_SIZE = 40;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ScreenBack = ({ tone = 'surface', color = 'text' }: ScreenBackProps) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Назад"
      hitSlop={hitSlopFor(BACK_SIZE)}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
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

const ScreenHeader = ({
  title,
  subtitle,
  trailing,
  leading,
  titleColor = 'text',
  subtitleColor = 'textMuted',
}: ScreenHeaderProps) => {
  return (
    <View style={styles.header}>
      {leading}

      <View style={styles.headerText}>
        <Text variant="title" themeColor={titleColor} numberOfLines={1}>
          {title}
        </Text>

        {subtitle != null && (
          <Text variant="small" themeColor={subtitleColor}>
            {subtitle}
          </Text>
        )}
      </View>

      {trailing}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const ScreenRoot = ({
  children,
  variant = 'background',
  gap = 'two',
  isTabBarVisible = true,
  style,
}: ScreenRootProps) => {
  // The bottom edge stays off `SafeAreaView` on purpose: padding it there would
  // clip the scroll view instead of letting content scroll past the indicator.
  // It goes on the scroll content, together with the tab-bar inset.
  const insets = useSafeAreaInsets();

  const column = (
    <View style={[styles.column, { gap: SPACING[gap] }, style]}>
      {children}
    </View>
  );

  return (
    <ThemedView variant={variant} style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                (isTabBarVisible ? BOTTOM_TAB_INSET : insets.bottom) +
                SPACING.four,
            },
          ]}
        >
          {column}
        </ScrollView>
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
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: SPACING.three,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  safeArea: {
    flex: 1,
  },
});

export type { ScreenBackProps, ScreenHeaderProps, ScreenRootProps };
