import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  memo,
  type ReactNode,
  useContext,
} from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import type { WatcherId } from '@/entities/watcher';

import { RADII, SOUNDS, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { playSfx } from '@/shared/lib';
import {
  Button,
  type ButtonVariant,
  ChamferCard,
  PixelIcon,
  type PixelIconName,
  TerminalPanel,
  Text,
} from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TerminalTones {
  lcd: string;
  lcdDim: string;
  watcher: WatcherId;
}

interface TerminalShellProps {
  watcher: WatcherId;
  /** Machine line over the title — "хранитель · план". */
  label: string;
  title: string;
  /**
   * Shows the back square and the "[ вернуться в яму ]" link; omitted on the
   * watcher's own menu, which closes with its cross instead.
   */
  onBack?: () => void;
  /** Right side of the header: "?", the wallet, or the close cross. */
  trailing?: ReactNode;
  /** The one main action of the page, pinned above the exit link. */
  footer?: ReactNode;
  children?: ReactNode;
  onLeave: () => void;
  style?: StyleProp<ViewStyle>;
}

/** What every page gets from the dock: who speaks, the way back, the way out. */
type TerminalFrame = Pick<TerminalShellProps, 'watcher' | 'onLeave' | 'onBack'>;

interface TerminalPromptProps {
  children: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
}

interface TerminalMenuProps {
  children?: ReactNode;
}

interface TerminalMenuRowProps {
  label: string;
  description?: string;
  icon?: PixelIconName;
  /** Short machine value on the right — "+20", "снова в п. 4". */
  value?: string;
  isDone?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

type TerminalCardVariant = 'default' | 'selected' | 'raised' | 'warning';

interface TerminalCardProps {
  children?: ReactNode;
  variant?: TerminalCardVariant;
  style?: StyleProp<ViewStyle>;
}

interface TerminalBubbleProps {
  /** What the watcher says — a full sentence, in the reading typeface. */
  children: string;
}

interface TerminalRuleProps {
  /** Dashed means "not decided yet" — the remainder line of the plan. */
  isDashed?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface TerminalTextProps {
  children: string;
  isDim?: boolean;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TerminalToneContext = createContext<TerminalTones | null>(null);

const CARD_COLORS: Record<
  TerminalCardVariant,
  {
    background: 'surface' | 'surfaceSoft';
    border: 'border' | 'phosphor' | 'borderStrong' | 'warning';
  }
> = {
  default: { background: 'surface', border: 'border' },
  selected: { background: 'surface', border: 'phosphor' },
  raised: { background: 'surfaceSoft', border: 'borderStrong' },
  warning: { background: 'surface', border: 'warning' },
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export const useTerminalTones = () => {
  const context = useContext(TerminalToneContext);
  if (!context) throw new Error('Terminal content needs a TerminalShell');
  return context;
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const TerminalRule = ({
  isDashed = false,
  style,
}: TerminalRuleProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        isDashed ? styles.dashedRule : styles.rule,
        { borderColor: theme.border },
        style,
      ]}
    />
  );
};

/** One module on the screen: surface, a 2 pt frame, radius 14. */
export const TerminalCard = ({
  children,
  variant = 'default',
  style,
}: TerminalCardProps) => {
  const theme = useTheme();
  const colors = CARD_COLORS[variant];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme[colors.background],
          borderColor: theme[colors.border],
        },
        variant === 'warning' && styles.dashed,
        style,
      ]}
    >
      {children}
    </View>
  );
};

/**
 * The watcher's line as speech (UI kit 09): the Keeper's bubble is rounded
 * with an ear at the top left, the Overseer's has his cut corner.
 */
export const TerminalBubble = ({ children }: TerminalBubbleProps) => {
  const theme = useTheme();
  const { watcher } = useTerminalTones();

  if (watcher === 'overseer') {
    return (
      <ChamferCard variant="topRight" fillTone="overseerSurface">
        <Text accessibilityLiveRegion="polite">{children}</Text>
      </ChamferCard>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text accessibilityLiveRegion="polite">{children}</Text>
    </View>
  );
};

export const TerminalPrompt = memo(
  ({
    children,
    variant = 'secondary',
    onPress,
    disabled,
  }: TerminalPromptProps) => {
    if (!onPress) return <Text>{children}</Text>;

    return (
      <Button
        variant={variant}
        disabled={disabled}
        onPress={onPress}
        isFullWidth
      >
        {children}
      </Button>
    );
  },
);

/** Rows of one list share a frame and a hairline between them. */
export const TerminalMenu = ({ children }: TerminalMenuProps) => {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.menu, { borderColor: theme.border }]}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? (
            <View
              style={[styles.hairline, { backgroundColor: theme.border }]}
            />
          ) : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
};

export const TerminalMenuRow = memo(
  ({
    label,
    description,
    icon,
    value,
    isDone = false,
    isSelected = false,
    disabled = false,
    onPress,
  }: TerminalMenuRowProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { watcher } = useTerminalTones();
    const tone = watcher === 'overseer' ? 'overseerLcd' : 'phosphor';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: isSelected }}
        disabled={disabled}
        onPress={() => {
          playSfx(SOUNDS.UI_TAP);
          onPress();
        }}
        style={({ pressed }) => [
          styles.menuRow,
          (pressed || isSelected) && { backgroundColor: theme.surfaceSoft },
        ]}
      >
        {icon ? (
          <PixelIcon name={icon} tone={disabled ? 'textDisabled' : tone} />
        ) : null}
        <View style={styles.menuCopy}>
          <Text
            variant="bodyBold"
            themeColor={disabled || isDone ? 'textSecondary' : 'text'}
          >
            {label}
          </Text>
          {description ? (
            <Text variant="small" themeColor="textMuted">
              {description}
            </Text>
          ) : null}
        </View>
        {value ? <Text variant="machine">{value}</Text> : null}
        {isDone ? (
          <View style={styles.done}>
            <PixelIcon name="check" size={12} />
            <Text variant="small" themeColor="textMuted">
              {t('tasks.doneShort')}
            </Text>
          </View>
        ) : (
          <PixelIcon
            name={disabled ? 'lock' : 'chevron'}
            size={disabled ? 12 : 24}
            tone={disabled ? 'textDisabled' : tone}
          />
        )}
      </Pressable>
    );
  },
);

export const TerminalText = memo(
  ({ children, isDim = false }: TerminalTextProps) => (
    <Text themeColor={isDim ? 'textSecondary' : 'text'}>{children}</Text>
  ),
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The terminal a watcher talks through (concept B2, D1, E1): back square,
 * the voice's machine label over a readable title, one action at the bottom
 * and the "[ вернуться в яму ]" link that always leads out.
 */
export const TerminalShell = ({
  watcher,
  label,
  title,
  onBack,
  trailing,
  footer,
  children,
  onLeave,
  style,
}: TerminalShellProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tones: TerminalTones = {
    lcd: watcher === 'keeper' ? theme.phosphor : theme.overseerLcd,
    lcdDim: theme.textSecondary,
    watcher,
  };
  const isOverseer = watcher === 'overseer';

  return (
    <TerminalToneContext.Provider value={tones}>
      <TerminalPanel
        variant={watcher}
        frameStyle={styles.root}
        style={[styles.root, style]}
      >
        <View style={styles.body}>
          <View style={styles.header}>
            {onBack ? (
              <Button
                variant="icon"
                accessibilityLabel={t('common.back')}
                onPress={onBack}
              >
                <PixelIcon name="back" />
              </Button>
            ) : null}
            <View style={styles.heading}>
              <Text
                accessibilityRole="header"
                variant="machine"
                themeColor={isOverseer ? 'overseerLcd' : 'phosphor'}
                style={isOverseer && styles.overseerLabel}
              >
                {isOverseer
                  ? `// ${label.toLocaleUpperCase()}`
                  : `> ${label.toLocaleLowerCase()}`}
              </Text>
              <Text variant="title">{title}</Text>
            </View>
            {trailing}
          </View>
          <View style={styles.content}>{children}</View>
          <View style={styles.footer}>
            {footer}
            {onBack ? (
              <Button
                variant="ghost"
                size="s"
                onPress={onLeave}
                isFullWidth
                style={styles.leave}
              >
                {t('watcher.terminal.leaveLabel')}
              </Button>
            ) : null}
          </View>
        </View>
      </TerminalPanel>
    </TerminalToneContext.Provider>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
    gap: SPACING.compact,
    minHeight: 0,
    paddingBottom: SPACING.three,
    paddingHorizontal: 14,
    paddingTop: SPACING.three,
  },
  bubble: {
    borderBottomLeftRadius: RADII.m,
    borderBottomRightRadius: RADII.m,
    borderTopLeftRadius: SPACING.one,
    borderTopRightRadius: RADII.m,
    borderWidth: 2,
    paddingHorizontal: SPACING.compact,
    paddingVertical: 10,
  },
  card: {
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.two,
    padding: SPACING.compact,
  },
  // Shrinks, never grows: the terminal is as tall as what it says, and a
  // long page scrolls once the dock's cap is reached.
  content: {
    flexShrink: 1,
    minHeight: 0,
  },
  dashed: { borderStyle: 'dashed' },
  dashedRule: {
    borderStyle: 'dashed',
    borderTopWidth: 2,
  },
  done: { alignItems: 'center', flexDirection: 'row', gap: SPACING.one },
  footer: { gap: SPACING.one },
  hairline: { height: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  heading: { flex: 1, gap: 2, minWidth: 0 },
  leave: { marginBottom: -SPACING.compact },
  menu: {
    borderRadius: RADII.m,
    borderWidth: 2,
    overflow: 'hidden',
  },
  menuCopy: { flex: 1, gap: 2, minWidth: 0 },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.compact,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  overseerLabel: { letterSpacing: 1 },
  root: { flexShrink: 1, minHeight: 0 },
  rule: {
    borderBottomWidth: 1,
    marginVertical: SPACING.one,
  },
});

export type {
  TerminalBubbleProps,
  TerminalCardProps,
  TerminalCardVariant,
  TerminalFrame,
  TerminalMenuProps,
  TerminalMenuRowProps,
  TerminalShellProps,
};
