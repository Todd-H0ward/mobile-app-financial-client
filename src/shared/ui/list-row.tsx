import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { PixelIcon } from './pixel-icon';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ListRowIconProps {
  children?: ReactNode;
  /** Tinted background of the icon tile. */
  tone?: ThemeColor;
  size?: number;
}

interface ListRowRootProps {
  title: string;
  subtitle?: string;
  /** Leading slot — usually `<ListRow.Icon>`. */
  icon?: ReactNode;
  /** Trailing slot: a button, a price, a checkmark. */
  trailing?: ReactNode;
  /** Highlighted with the primary border, e.g. a chosen trait. */
  isSelected?: boolean;
  /** Completed row: muted text and a visible completion check. */
  isDone?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const BORDER = 2;
const SELECTED_BORDER = 2;
const PADDING_HORIZONTAL = 14;
const PADDING_VERTICAL = 13;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ListRowIcon = ({
  children,
  tone = 'primarySoft',
  size = 36,
}: ListRowIconProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.icon,
        {
          backgroundColor: theme[tone],
          height: size,
          width: size,
        },
      ]}
    >
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const ListRowRoot = ({
  title,
  subtitle,
  icon,
  trailing,
  isSelected = false,
  isDone = false,
  onPress,
  style,
}: ListRowRootProps) => {
  const theme = useTheme();

  const rowStyle: StyleProp<ViewStyle> = [
    styles.root,
    {
      backgroundColor: isSelected
        ? theme.surfaceSoft
        : isDone
          ? theme.backgroundAlt
          : theme.surface,
      borderColor: isSelected ? theme.primary : theme.border,
      borderWidth: isSelected ? SELECTED_BORDER : BORDER,
      // The thicker border eats into the content box, so the padding gives
      // back exactly what it took: selecting a row must not nudge its text.
      paddingHorizontal:
        PADDING_HORIZONTAL - (isSelected ? SELECTED_BORDER : BORDER),
      paddingVertical:
        PADDING_VERTICAL - (isSelected ? SELECTED_BORDER : BORDER),
    },
    style,
  ];

  const content = (
    <>
      {isSelected && <PixelIcon name="check20" size={20} tone="primary" />}
      {icon}

      <View style={styles.content}>
        <Text variant="bodyBold" themeColor={isDone ? 'textMuted' : 'text'}>
          {title}
        </Text>

        {subtitle != null && (
          <Text
            variant="small"
            themeColor={isDone ? 'textDisabled' : 'textMuted'}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {isDone && !isSelected && (
        <PixelIcon name="check20" size={20} tone="primary" />
      )}
      {trailing}
    </>
  );

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle != null ? `${title}. ${subtitle}` : title}
      accessibilityState={{ selected: isSelected, checked: isDone }}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed && { backgroundColor: theme.surfaceSoft },
      ]}
    >
      {content}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const ListRow = Object.assign(ListRowRoot, {
  Icon: ListRowIcon,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: SPACING.TWO,
    // A pressable row is a touch target: the floor is stated, not left to the
    // sum of a font size and two paddings — see docs/accessibility.md.
    minHeight: 56,
  },
  content: {
    flex: 1,
    gap: SPACING.ONE,
    minWidth: 0,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
  },
});

export type { ListRowIconProps, ListRowRootProps };
