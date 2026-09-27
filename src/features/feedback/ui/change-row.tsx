import { StyleSheet, View } from 'react-native';

import { FONTS, SPACING } from '@/shared/constants';
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
      <Text themeColor="textSecondary" style={styles.label}>
        {t(line.labelKey)}
      </Text>
      <Text variant="code" style={styles.value}>
        {before}
        <Text variant="code" themeColor="textMuted">
          {' → '}
        </Text>
        <Text
          variant="machine"
          themeColor={line.after >= line.before ? 'phosphor' : 'text'}
          style={styles.value}
        >
          {after}
        </Text>
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
    gap: SPACING.TWO,
    paddingHorizontal: SPACING.COMPACT,
    paddingVertical: SPACING.TWO,
  },
  value: { fontFamily: FONTS.monoStrong, fontSize: 16, lineHeight: 22 },
});

export type { ChangeRowProps };
