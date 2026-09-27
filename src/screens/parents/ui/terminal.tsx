import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { PixelIcon, Text, type TextProps } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface TerminalRootProps {
  children?: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
}
type TerminalLineTone = 'bright' | 'dim' | 'alert';
interface TerminalLineProps extends TextProps {
  tone?: TerminalLineTone;
  isPrompt?: boolean;
  order?: number;
}
interface TerminalRowProps {
  name: string;
  value: string;
  order?: number;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

const TerminalLine = ({
  tone = 'bright',
  isPrompt = false,
  order: _order,
  children,
  ...props
}: TerminalLineProps) => (
  <Text
    themeColor={
      tone === 'alert' ? 'warning' : tone === 'dim' ? 'textSecondary' : 'text'
    }
    {...props}
  >
    {isPrompt ? '> ' : ''}
    {children}
  </Text>
);
const TerminalRow = ({ name, value }: TerminalRowProps) => (
  <View style={styles.row} accessible accessibilityLabel={`${name}: ${value}`}>
    <Text themeColor="textSecondary" style={styles.name}>
      {name}
    </Text>
    <Text variant="bodyBold" style={styles.value}>
      {value}
    </Text>
  </View>
);
const TerminalRule = () => {
  const theme = useTheme();
  return <View style={[styles.rule, { borderColor: theme.border }]} />;
};
const TerminalCursor = () => {
  const theme = useTheme();
  return (
    <View
      accessible={false}
      style={[styles.cursor, { backgroundColor: theme.phosphor }]}
    />
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const TerminalRoot = ({ children, label, style }: TerminalRootProps) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      <View style={styles.bar}>
        <PixelIcon name="lock" size={12} tone="textMuted" />
        <Text variant="machine" themeColor="textMuted" style={styles.name}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const Terminal = Object.assign(TerminalRoot, {
  Line: TerminalLine,
  Row: TerminalRow,
  Rule: TerminalRule,
  Cursor: TerminalCursor,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.TWO,
    paddingBottom: SPACING.TWO,
  },
  cursor: { height: 24, width: 10 },
  name: { flex: 1, minWidth: 0 },
  root: {
    borderRadius: RADII.m,
    borderWidth: 2,
    gap: SPACING.TWO,
    padding: SPACING.COMPACT,
  },
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
    justifyContent: 'space-between',
  },
  rule: { borderTopWidth: 2, marginVertical: SPACING.TWO },
  value: { flexShrink: 1, textAlign: 'right' },
});

export type {
  TerminalLineProps,
  TerminalLineTone,
  TerminalRootProps,
  TerminalRowProps,
};
