import { useId, useState } from 'react';

import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { FONTS, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';

import { Text } from './text';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type InputVariant = 'default' | 'warning';

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  variant?: InputVariant;
  /** Shows "6 / 12" when `maxLength` is set. */
  isCounterVisible?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const Input = ({
  label,
  hint,
  variant = 'default',
  isCounterVisible = false,
  containerStyle,
  style,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  editable = true,
  maxLength,
  accessibilityLabel,
  ...props
}: InputProps) => {
  const theme = useTheme();
  const labelId = useId();
  const [typed, setTyped] = useState(defaultValue ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const text = value ?? typed;
  const isWarning = variant === 'warning';

  return (
    <View style={[styles.root, containerStyle]}>
      {label != null && (
        <Text nativeID={labelId} variant="small" themeColor="textSecondary">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.fieldContainer,
          {
            backgroundColor: editable ? theme.surface : theme.surfaceDeep,
            borderColor: isWarning
              ? theme.warning
              : isFocused
                ? theme.primary
                : theme.borderStrong,
          },
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? hint}
          accessibilityLabelledBy={label != null ? labelId : undefined}
          value={value}
          defaultValue={defaultValue}
          editable={editable}
          maxLength={maxLength}
          onChangeText={(next) => {
            setTyped(next);
            onChangeText?.(next);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={theme.textDisabled}
          selectionColor={theme.primary}
          style={[
            styles.field,
            { color: editable ? theme.text : theme.textDisabled },
            style,
          ]}
          {...props}
        />
        {isCounterVisible && maxLength != null && (
          <Text variant="code" themeColor="textMuted" style={styles.counter}>
            {text.length} / {maxLength}
          </Text>
        )}
      </View>
      {hint != null && (
        <Text variant="small" themeColor={isWarning ? 'warning' : 'textMuted'}>
          {isWarning ? '! ' : ''}
          {hint}
        </Text>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  counter: { flexShrink: 0, fontSize: 12, paddingRight: SPACING.TWO },
  disabled: { borderStyle: 'dashed' },
  field: {
    flex: 1,
    // Static font files: the weight lives in the family, not in fontWeight.
    fontFamily: FONTS.sansStrong,
    fontSize: 18,
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: SPACING.THREE,
    paddingVertical: SPACING.TWO,
  },
  fieldContainer: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 56,
  },
  root: { gap: SPACING.TWO, width: '100%' },
});

export type { InputProps, InputVariant };
