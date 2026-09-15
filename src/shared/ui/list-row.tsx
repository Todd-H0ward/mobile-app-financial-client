import type { ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { RADII, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

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
  /** Completed row: muted surface and a struck-through title. */
  isDone?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ListRowIcon = ({
  children,
  tone = 'primarySoft',
  size = 46,
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
      backgroundColor: isDone ? theme.backgroundAlt : theme.surface,
      borderColor: isSelected ? theme.primary : theme.border,
      borderWidth: isSelected ? 2.5 : 1,
    },
    style,
  ];

  const content = (
    <>
      {icon}

      <View style={styles.content}>
        <Text
          variant="bodyBold"
          themeColor={isDone ? 'textMuted' : 'text'}
          style={isDone && styles.doneTitle}
        >
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
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
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
    borderRadius: RADII.l,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  icon: {
    alignItems: 'center',
    borderRadius: RADII.m,
    justifyContent: 'center',
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
});

export type { ListRowIconProps, ListRowRootProps };
