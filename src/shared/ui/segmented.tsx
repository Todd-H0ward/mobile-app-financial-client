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

interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
  icon?: PixelIconName;
}

interface SegmentedProps<Value extends string> {
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Two or three tabs in one frame (concept D1): the chosen one is filled with
 * phosphor, the rest stay dark. The word is always there — never icon-only.
 */
export const Segmented = <Value extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedProps<Value>) => {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.root, { borderColor: theme.border }, style]}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.tab,
              isActive
                ? { backgroundColor: theme.primary }
                : pressed && { backgroundColor: theme.surfaceSoft },
            ]}
          >
            {option.icon ? (
              <PixelIcon
                name={option.icon}
                size={12}
                tone={isActive ? 'onAccent' : 'textSecondary'}
              />
            ) : null}
            <Text
              variant={isActive ? 'smallBold' : 'small'}
              themeColor={isActive ? 'onAccent' : 'textSecondary'}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.one,
    padding: SPACING.one,
  },
  tab: {
    alignItems: 'center',
    borderRadius: RADII.s,
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.two,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: SPACING.one,
  },
});

export type { SegmentedOption, SegmentedProps };
