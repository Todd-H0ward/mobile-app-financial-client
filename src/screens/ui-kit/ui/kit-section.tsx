import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { SPACING } from '@/shared/constants';
import { Text, ThemedView } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface KitSectionProps {
  title: string;
  caption?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface KitRowProps {
  label?: string;
  children?: ReactNode;
  /** Lay the examples out in a row instead of a column. */
  isInline?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════
// COMPOUND COMPONENTS
// ═══════════════════════════════════════════

const KitRow = ({ label, children, isInline = false, style }: KitRowProps) => {
  return (
    <View style={[styles.row, style]}>
      {label != null && (
        <Text variant="label" themeColor="textMuted">
          {label.toUpperCase()}
        </Text>
      )}

      <View style={isInline ? styles.inline : styles.stack}>{children}</View>
    </View>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const KitSectionRoot = ({
  title,
  caption,
  children,
  style,
}: KitSectionProps) => {
  return (
    <ThemedView variant="surface" style={[styles.root, style]}>
      <View style={styles.heading}>
        <Text variant="subtitle">{title}</Text>

        {caption != null && (
          <Text variant="small" themeColor="textMuted">
            {caption}
          </Text>
        )}
      </View>

      {children}
    </ThemedView>
  );
};

// ═══════════════════════════════════════════
// COMPOUND EXPORT
// ═══════════════════════════════════════════

export const KitSection = Object.assign(KitSectionRoot, {
  Row: KitRow,
});

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    borderRadius: SPACING.THREE,
    gap: SPACING.THREE,
    padding: SPACING.THREE,
  },
  heading: {
    gap: SPACING.HALF,
  },
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
  },
  row: {
    gap: SPACING.ONE,
  },
  stack: {
    alignItems: 'flex-start',
    gap: SPACING.TWO,
  },
});

export type { KitRowProps, KitSectionProps };
