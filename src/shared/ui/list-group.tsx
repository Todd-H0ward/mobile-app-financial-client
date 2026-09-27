import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { PixelIcon, type PixelIconName } from './pixel-icon';
import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ListGroupRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface ListGroupItemProps {
  title: string;
  subtitle?: string;
  icon?: PixelIconName;
  /** A switch, a value, a pair of buttons. Replaces the chevron. */
  trailing?: ReactNode;
  /** Makes the row a button; without `trailing` it shows a chevron. */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ROW_MIN_HEIGHT = 56;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const ListGroupItem = ({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ListGroupItemProps) => {
  const theme = useTheme();
  const content = (
    <>
      {icon ? (
        <PixelIcon name={icon} tone={disabled ? 'textDisabled' : 'phosphor'} />
      ) : null}
      <View style={styles.copy}>
        <Text
          variant="bodyBold"
          themeColor={disabled ? 'textSecondary' : 'text'}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" themeColor="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <PixelIcon
            name={disabled ? 'lock' : 'chevron'}
            size={disabled ? 12 : 24}
            tone={disabled ? 'textDisabled' : 'phosphor'}
          />
        ) : null)}
    </>
  );

  if (!onPress) return <View style={styles.item}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed && { backgroundColor: theme.surfaceSoft },
      ]}
    >
      {content}
    </Pressable>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** One framed list with hairlines — reads as one thought, not stacked cards. */
const ListGroupRoot = ({ children, style }: ListGroupRootProps) => {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
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

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const ListGroup = Object.assign(ListGroupRoot, {
  Item: ListGroupItem,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  copy: { flex: 1, gap: 2, minWidth: 0 },
  hairline: { height: 1 },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  root: {
    borderRadius: RADII.m,
    borderWidth: 2,
    overflow: 'hidden',
  },
});

export type { ListGroupItemProps, ListGroupRootProps };
