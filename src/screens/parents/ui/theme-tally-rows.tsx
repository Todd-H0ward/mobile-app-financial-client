import { StyleSheet, View } from 'react-native';

import type { ThemeTally } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { ProgressBar, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ThemeTallyRowsProps {
  rows: ThemeTally[];
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Chores done, by theme — the third of the four questions in docs/parents.md.
 *
 * The bars share one ceiling so the three themes are comparable at a glance:
 * the point is which subject the child keeps choosing, not the absolute count.
 */
export const ThemeTallyRows = ({ rows }: ThemeTallyRowsProps) => {
  const { t } = useTranslation();
  const ceiling = Math.max(1, ...rows.map((row) => row.done));

  return (
    <View style={styles.root}>
      {rows.map((row) => (
        <View key={row.theme} style={styles.row}>
          <Text variant="small" style={styles.label} numberOfLines={1}>
            {t(`parents.report.themes.${row.theme}`)}
          </Text>

          <ProgressBar
            value={row.done / ceiling}
            height={8}
            color="primary"
            style={styles.bar}
          />

          <Text variant="smallBold" style={styles.count}>
            {row.done}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.two,
  },
  bar: {
    flex: 1,
  },
  count: {
    minWidth: 24,
    textAlign: 'right',
  },
  label: {
    minWidth: 96,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { ThemeTallyRowsProps };
