import type { ReactNode } from 'react';

import { StyleSheet, View, type ViewStyle } from 'react-native';

import { SPACING, type ThemeColor } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import {
  Button,
  Card,
  ListRow,
  PixelIcon,
  Text,
  type TextProps,
} from '@/shared/ui';

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

type ChoiceMark = 'right' | 'wrong';

interface TerminalChoiceProps {
  children?: string;
  index: number;
  mark?: ChoiceMark | null;
  isAnswered?: boolean;
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
  mark = null,
  isAnswered = false,
  onPress,
}: TerminalChoiceProps) => {
  const theme = useTheme();

  return (
    <ListRow
      title={children}
      icon={
        <Text variant="code" themeColor="primary">
          {String(index + 1).padStart(2, '0')}
        </Text>
      }
      trailing={
        mark === 'right' ? (
          <PixelIcon name="check20" size={20} tone="primary" />
        ) : mark === 'wrong' ? (
          <PixelIcon name="close" size={16} tone="warning" />
        ) : null
      }
      // Not `isSelected` — its check sits left; keep both marks in one column.
      style={
        mark === 'right'
          ? { backgroundColor: theme.surfaceSoft, borderColor: theme.primary }
          : mark === 'wrong'
            ? { borderColor: theme.warning }
            : undefined
      }
      onPress={isAnswered ? undefined : onPress}
    />
  );
};

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
  rule: { height: SPACING.ONE },
});

export type {
  ChoiceMark,
  TerminalChoiceProps,
  TerminalKeyProps,
  TerminalLineProps,
  TerminalRowProps,
  TerminalTone,
};
