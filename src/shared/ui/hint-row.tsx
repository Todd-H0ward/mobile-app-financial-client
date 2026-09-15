import type { ReactElement, ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { SPACING } from '@/shared/constants';
import { isTextOnly } from '@/shared/utils';

import { Text, type TextProps } from './text';
import { ThemedView } from './themed-view';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HintRowRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface HintRowHintProps {
  children?: string | ReactElement;
  style?: StyleProp<ViewStyle>;
}

type HintRowTitleProps = TextProps;

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

const HintRowHint = ({ children, style }: HintRowHintProps) => {
  return (
    <ThemedView variant="surfaceDeep" style={[styles.hint, style]}>
      {isTextOnly(children) ? (
        <Text themeColor="textSecondary">{children}</Text>
      ) : (
        children
      )}
    </ThemedView>
  );
};

const HintRowTitle = ({
  children,
  variant = 'small',
  ...props
}: HintRowTitleProps) => {
  return (
    <Text variant={variant} {...props}>
      {children}
    </Text>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const HintRowRoot = ({ children, style }: HintRowRootProps) => {
  return <View style={[styles.root, style]}>{children}</View>;
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const HintRow = Object.assign(HintRowRoot, {
  Title: HintRowTitle,
  Hint: HintRowHint,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    borderRadius: SPACING.two,
    paddingHorizontal: SPACING.two,
    paddingVertical: SPACING.half,
  },
});

export type { HintRowHintProps, HintRowRootProps, HintRowTitleProps };
