import { StyleSheet, View } from 'react-native';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import type { ChangeLine } from '../lib';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ChangeRowProps {
  line: ChangeLine;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const formatValue = (value: number, format: ChangeLine['format']): string => {
  if (format === 'money') return formatMoney(value);
  if (format === 'percent') return `${Math.round(value * 100)}%`;
  return String(value);
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** One before → after line of «что изменилось». */
export const ChangeRow = ({ line }: ChangeRowProps) => {
  const { t } = useTranslation();
  const before = formatValue(line.before, line.format);
  const after = formatValue(line.after, line.format);

  return (
    <View
      style={styles.root}
      accessibilityLabel={`${t(line.labelKey)}: ${before} → ${after}`}
    >
      <Text variant="small" themeColor="textSecondary" style={styles.label}>
        {t(line.labelKey)}
      </Text>
      <Text variant="smallBold">
        {before}
        <Text variant="small" themeColor="textMuted">
          {' → '}
        </Text>
        {after}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  label: {
    flex: 1,
  },
  root: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.two,
  },
});

export type { ChangeRowProps };
