import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
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

import { GlassSurface } from './glass-surface';
import { PixelIcon } from './pixel-icon';
import { RingsBackdrop } from './rings-backdrop';
import { TerminalPanel, type TerminalVariant } from './terminal-panel';
import { Text, type TextProps } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ScreenRootProps {
  children?: ReactNode;
  variant?: ThemeColor;
  terminalVariant?: TerminalVariant;
  /**
   * A strip of the pit above the terminal — the child always sees where they
   * are. Off for the grown-ups' terminal, which is deliberately not the game.
   */
  isPitVisible?: boolean;
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

interface ScreenLabelProps {
  /** Machine line over the title — "настройки", "журнал". */
  children: string;
  voice?: TerminalVariant;
}

type ScreenTitleProps = TextProps;

type ScreenSubtitleProps = TextProps;

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Visual size of the back control; hitSlop expands it to HIT_SLOP_SIZE. */
const BACK_SIZE = 48;
/** The strip of the pit above the terminal. */
const PIT_HEIGHT = 56;

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
    <GlassSurface
      tone={tone}
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
      style={[styles.back, { borderColor: theme.borderStrong }]}
    >
      <PixelIcon name="back" tone={color} />
    </GlassSurface>
  );
};

const ScreenLabel = ({ children, voice = 'keeper' }: ScreenLabelProps) => {
  if (voice === 'overseer') {
    return (
      <Text variant="machine" themeColor="overseerLcd" style={styles.overseer}>
        {`// ${children.toLocaleUpperCase()}`}
      </Text>
    );
  }
  if (voice === 'adult') {
    return (
      <Text variant="code" themeColor="textMuted" style={styles.adult}>
        {children.toLocaleUpperCase()}
      </Text>
    );
  }
  return <Text variant="machine">{`> ${children.toLocaleLowerCase()}`}</Text>;
};

const ScreenTitle = ({
  children,
  variant = 'title',
  themeColor = 'text',
  numberOfLines,
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
  terminalVariant = 'keeper',
  isPitVisible = terminalVariant !== 'adult',
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
    <ThemedView variant="sceneBase" style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isPitVisible ? (
          <View style={styles.pit}>
            <RingsBackdrop centerY={0.62} />
          </View>
        ) : null}
        <TerminalPanel
          variant={terminalVariant}
          frameStyle={styles.frame}
          style={styles.panel}
        >
          <View style={styles.panelContent}>
            {isScrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
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
          </View>
        </TerminalPanel>
      </SafeAreaView>
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Screen = Object.assign(ScreenRoot, {
  Back: ScreenBack,
  Label: ScreenLabel,
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
    borderRadius: RADII.s,
    borderWidth: 2,
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
  frame: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.three,
    width: '100%',
  },
  adult: { letterSpacing: 1 },
  overseer: { letterSpacing: 1 },
  panel: { flex: 1 },
  pit: {
    alignSelf: 'stretch',
    height: PIT_HEIGHT - SPACING.two,
    marginHorizontal: -SPACING.two,
    marginTop: -SPACING.two,
    overflow: 'hidden',
  },
  panelContent: { flex: 1 },
  safeArea: { alignItems: 'center', flex: 1, padding: SPACING.two },
});

export type {
  ScreenBackProps,
  ScreenHeaderProps,
  ScreenHeadingProps,
  ScreenLabelProps,
  ScreenRootProps,
  ScreenSubtitleProps,
  ScreenTitleProps,
};
