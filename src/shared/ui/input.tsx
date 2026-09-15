import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { RADII } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface InputProps extends TextInputProps {
  /** Caption under the field, on the left. */
  hint?: string;
  /** Shows "6/12" on the right when `maxLength` is set. */
  isCounterVisible?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Input = ({
  hint,
  isCounterVisible = false,
  containerStyle,
  style,
  value,
  maxLength,
  ...props
}: InputProps) => {
  const theme = useTheme();

  return (
    <View style={[styles.root, containerStyle]}>
      <TextInput
        value={value}
        maxLength={maxLength}
        placeholderTextColor={theme.textDisabled}
        selectionColor={theme.primary}
        style={[
          styles.field,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
            color: theme.text,
          },
          style,
        ]}
        {...props}
      />

      {(hint != null || (isCounterVisible && maxLength != null)) && (
        <View style={styles.footer}>
          <Text variant="small" themeColor="textMuted">
            {hint ?? ''}
          </Text>

          {isCounterVisible && maxLength != null && (
            <Text variant="small" themeColor="textDisabled">
              {value?.length ?? 0}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: 8,
    width: '100%',
  },
  field: {
    borderRadius: RADII.xl,
    borderWidth: 2.5,
    fontSize: 22,
    fontWeight: 800,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});

export type { InputProps };
