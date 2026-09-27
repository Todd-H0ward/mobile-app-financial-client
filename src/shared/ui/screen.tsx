import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react';

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

/**
 * Pinned under the scroll — primary actions stay put when the body
 * grows or shrinks (recovery options, trial submit).
 */
interface ScreenFooterProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Pit strip above the terminal. */
const PIT_HEIGHT = 56;
/** Top gap so the status board stays readable above the tallest sheet. */
const SHEET_TOP_CLEARANCE = 104;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const isScreenFooter = (
  child: ReactNode,
): child is ReactElement<ScreenFooterProps> =>
  isValidElement(child) && child.type === ScreenFooter;

/** Pull `Screen.Footer` out of the scroll column so it can sit on the panel edge. */
const splitScreenChildren = (children: ReactNode) => {
  const body: ReactNode[] = [];
  let footer: ReactElement<ScreenFooterProps> | null = null;

  Children.forEach(children, (child) => {
    if (isScreenFooter(child)) {
      footer = child;
      return;
    }
    body.push(child);
  });

  return { body, footer };
};

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

const ScreenFooter = ({ children, style }: ScreenFooterProps) => (
  <View style={[styles.footer, style]}>{children}</View>
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
  // It goes on the scroll content with the home-indicator inset — or on the
  // pinned footer when one is set, so actions sit on the safe bottom.
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  // Edge-to-edge Android reports the window without its system bars; the
  // sheet measures the space it really has instead.
  const [areaHeight, setAreaHeight] = useState<number | null>(null);

  const { body, footer } = splitScreenChildren(children);
  const bottomPad = insets.bottom + SPACING.FOUR;
  const contentBottomPad = footer ? SPACING.TWO : bottomPad;

  const column = (
    <View
      style={[
        styles.column,
        !isScrollable && styles.columnFill,
        { gap },
        style,
      ]}
    >
      {body}
    </View>
  );

  const footerNode = footer ? (
    <View
      style={
        presentation === 'sheet'
          ? styles.sheetFooterPad
          : { paddingBottom: bottomPad }
      }
    >
      {footer}
    </View>
  ) : null;

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
    // A footer needs the panel to fill the sheet so actions sit on the bottom
    // edge instead of riding up under short content.
    const sheetSize =
      footer || !isScrollable ? { height: maxHeight } : { maxHeight };

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
            frameStyle={[styles.sheetFrame, sheetSize]}
            style={footer ? styles.sheetPanelFill : styles.sheetPanel}
          >
            <View style={footer ? styles.panelBody : undefined}>
              {isScrollable ? (
                <ScrollView
                  style={footer ? styles.sheetScrollFill : styles.sheetScroll}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={[
                    styles.content,
                    { paddingBottom: footer ? SPACING.TWO : SPACING.THREE },
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
              {footerNode}
            </View>
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
                style={footer ? styles.scrollFill : undefined}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={[
                  styles.content,
                  { paddingBottom: contentBottomPad },
                ]}
              >
                {column}
              </ScrollView>
            ) : (
              <View
                style={[
                  styles.content,
                  styles.static,
                  { paddingBottom: contentBottomPad },
                ]}
              >
                {column}
              </View>
            )}
            {footerNode}
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
  Footer: ScreenFooter,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  adult: { letterSpacing: 1 },
  column: {
    flexGrow: 1,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
  },
  columnFill: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: SPACING.THREE,
  },
  footer: {
    gap: SPACING.ONE,
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: SPACING.TWO,
    width: '100%',
  },
  frame: {
    flex: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
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
  overseer: { letterSpacing: 1 },
  panel: { flex: 1 },
  panelBody: {
    flex: 1,
    minHeight: 0,
  },
  panelContent: { flex: 1 },
  pit: {
    alignSelf: 'stretch',
    height: PIT_HEIGHT - SPACING.TWO,
    marginHorizontal: -SPACING.TWO,
    marginTop: -SPACING.TWO,
    overflow: 'hidden',
  },
  root: {
    flex: 1,
  },
  safeArea: { alignItems: 'center', flex: 1, padding: SPACING.TWO },
  scrollFill: {
    flex: 1,
    minHeight: 0,
  },
  sheetArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.TWO,
  },
  sheetFooterPad: {
    paddingBottom: SPACING.THREE,
  },
  sheetFrame: {
    flexShrink: 1,
    maxWidth: MAX_CONTENT_WIDTH + SPACING.THREE,
    width: '100%',
  },
  sheetPanel: { flexShrink: 1 },
  sheetPanelFill: {
    flex: 1,
  },
  // Content-sized until the cap, then it scrolls inside the terminal.
  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  sheetScrollFill: {
    flex: 1,
    minHeight: 0,
  },
  static: {
    flex: 1,
  },
});

export type {
  ScreenBackProps,
  ScreenFooterProps,
  ScreenHeaderProps,
  ScreenHeadingProps,
  ScreenLabelProps,
  ScreenPresentation,
  ScreenRootProps,
  ScreenSubtitleProps,
  ScreenTitleProps,
};
