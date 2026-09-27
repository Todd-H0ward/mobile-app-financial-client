import { type ReactNode, useState } from 'react';

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
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
  SPACING,
  type Spacing,
  STATIC_ROUTES,
  type ThemeColor,
} from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Button } from './button';
import { PixelIcon } from './pixel-icon';
import { RingsBackdrop } from './rings-backdrop';
import { TerminalPanel, type TerminalVariant } from './terminal-panel';
import { Text, type TextProps } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

/** `sheet` needs `transparentModal` so the pit shows through (`_layout`). */
type ScreenPresentation = 'full' | 'sheet';

interface ScreenRootProps {
  children?: ReactNode;
  variant?: ThemeColor;
  terminalVariant?: TerminalVariant;
  presentation?: ScreenPresentation;
  /** Pit strip above the terminal; off for parents (not the game). */
  isPitVisible?: boolean;
  gap?: Spacing;
  /** False when a child owns scroll (`FlatList`) so lists stay virtualized. */
  isScrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ScreenBackProps {
  accessibilityLabel?: string;
}

/** Header is children-in-order: leading, heading, trailing — no hidden slots. */
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

/** Pit strip above the terminal. */
const PIT_HEIGHT = 56;
/** Top gap so the status board stays readable above the tallest sheet. */
const SHEET_TOP_CLEARANCE = 104;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** UI kit 04 "иконки 48": the bordered square, same as in every terminal. */
const ScreenBack = ({ accessibilityLabel }: ScreenBackProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Button
      variant="icon"
      accessibilityLabel={accessibilityLabel ?? t('common.back')}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.dismissTo(STATIC_ROUTES.HOME);
      }}
    >
      <PixelIcon name="back" />
    </Button>
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
  presentation = 'full',
  isPitVisible = terminalVariant !== 'adult',
  gap = SPACING.TWO,
  isScrollable = true,
  style,
}: ScreenRootProps) => {
  // The bottom edge stays off `SafeAreaView` on purpose: padding it there would
  // clip the scroll view instead of letting content scroll past the indicator.
  // It goes on the scroll content with the home-indicator inset.
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  // Edge-to-edge Android reports the window without its system bars; the
  // sheet measures the space it really has instead.
  const [areaHeight, setAreaHeight] = useState<number | null>(null);

  const bottomPad = insets.bottom + SPACING.FOUR;

  const column = (
    <View
      style={[
        styles.column,
        !isScrollable && styles.columnFill,
        { gap },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (presentation === 'sheet') {
    const close = () => {
      if (router.canGoBack()) router.back();
      else router.dismissTo(STATIC_ROUTES.HOME);
    };
    const maxHeight = Math.max(
      320,
      (areaHeight ?? windowHeight) -
        insets.top -
        SHEET_TOP_CLEARANCE -
        insets.bottom -
        SPACING.TWO,
    );

    return (
      <View
        style={styles.root}
        onLayout={(event) => setAreaHeight(event.nativeEvent.layout.height)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
        />
        <View
          pointerEvents="box-none"
          style={[
            styles.sheetArea,
            { paddingBottom: insets.bottom + SPACING.TWO },
          ]}
        >
          <TerminalPanel
            variant={terminalVariant}
            frameStyle={[
              styles.sheetFrame,
              isScrollable ? { maxHeight } : { height: maxHeight },
            ]}
            style={styles.sheetPanel}
          >
            {isScrollable ? (
              <ScrollView
                style={styles.sheetScroll}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={[
                  styles.content,
                  { paddingBottom: SPACING.THREE },
                ]}
              >
                {column}
              </ScrollView>
            ) : (
              <View
                style={[
                  styles.content,
                  styles.static,
                  { paddingBottom: SPACING.TWO },
                ]}
              >
                {column}
              </View>
            )}
          </TerminalPanel>
        </View>
      </View>
    );
  }

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
    paddingTop: SPACING.THREE,
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
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  adult: { letterSpacing: 1 },
  overseer: { letterSpacing: 1 },
  panel: { flex: 1 },
  pit: {
    alignSelf: 'stretch',
    height: PIT_HEIGHT - SPACING.TWO,
    marginHorizontal: -SPACING.TWO,
    marginTop: -SPACING.TWO,
    overflow: 'hidden',
  },
  panelContent: { flex: 1 },
  safeArea: { alignItems: 'center', flex: 1, padding: SPACING.TWO },
  sheetArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.TWO,
  },
  sheetFrame: {
    flexShrink: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  sheetPanel: { flexShrink: 1 },
  // Content-sized until the cap, then it scrolls inside the terminal.
  sheetScroll: { flexGrow: 0, flexShrink: 1 },
});

export type {
  ScreenBackProps,
  ScreenHeaderProps,
  ScreenHeadingProps,
  ScreenLabelProps,
  ScreenPresentation,
  ScreenRootProps,
  ScreenSubtitleProps,
  ScreenTitleProps,
};
