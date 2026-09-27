import type { ReactNode } from 'react';

import { StyleSheet, View, type ViewStyle } from 'react-native';

import { SPACING, type ThemeColor } from '@/shared/constants';
import { Button, Card, ListRow, Text, type TextProps } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type TerminalTone = 'amber' | 'cyan' | 'text' | 'dim';

interface TerminalLineProps extends Omit<TextProps, 'variant'> {
  tone?: TerminalTone;
  variant?: 'heading' | 'label' | 'body';
}

interface TerminalRowProps {
  children?: ReactNode;
  style?: ViewStyle;
}

interface TerminalChoiceProps {
  children?: string;
  index: number;
  isSpent?: boolean;
  onPress: () => void;
}

interface TerminalKeyProps {
  children?: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TONE: Record<TerminalTone, ThemeColor> = {
  amber: 'primary',
  cyan: 'primary',
  text: 'text',
  dim: 'textSecondary',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const TerminalLine = ({
  tone = 'text',
  variant = 'body',
  ...props
}: TerminalLineProps) => (
  <Text
    variant={
      variant === 'heading' ? 'title' : variant === 'label' ? 'code' : 'body'
    }
    themeColor={TONE[tone]}
    {...props}
  />
);

const TerminalRule = () => <View style={styles.rule} />;

const TerminalChoice = ({
  children = '',
  index,
  isSpent = false,
  onPress,
}: TerminalChoiceProps) => (
  <ListRow
    title={children}
    icon={
      <Text variant="code" themeColor="primary">
        {String(index + 1).padStart(2, '0')}
      </Text>
    }
    onPress={onPress}
    isDone={isSpent}
  />
);

const TerminalKey = ({
  children,
  onPress,
  variant = 'primary',
}: TerminalKeyProps) => (
  <Button variant={variant} isFullWidth onPress={onPress}>
    {children}
  </Button>
);

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const TerminalPanel = ({ children, style }: TerminalRowProps) => (
  <Card>
    <Card.Content style={style}>{children}</Card.Content>
  </Card>
);

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Terminal = Object.assign(TerminalPanel, {
  Choice: TerminalChoice,
  Key: TerminalKey,
  Line: TerminalLine,
  Rule: TerminalRule,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  rule: { height: SPACING.one },
});

export type {
  TerminalChoiceProps,
  TerminalKeyProps,
  TerminalLineProps,
  TerminalRowProps,
  TerminalTone,
};
