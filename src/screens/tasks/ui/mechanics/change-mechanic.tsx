import { StyleSheet, View } from 'react-native';

import type { ChangePayload } from '@/entities/task';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { ListRow, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ChangeMechanicProps {
  payload: ChangePayload;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Pick how much change comes back. */
export const ChangeMechanic = ({
  payload,
  selectedId,
  onSelect,
}: ChangeMechanicProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text themeColor="textSecondary">
        {t('tasks.change.leadIn', {
          price: formatMoney(payload.price),
          paid: formatMoney(payload.paid),
        })}
      </Text>
      <Text variant="bodyBold">{t('tasks.change.question')}</Text>
      <View style={styles.options}>
        {payload.options.map((option) => (
          <ListRow
            key={option.id}
            title={option.label}
            isSelected={selectedId === option.id}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  options: {
    gap: SPACING.two,
  },
  root: {
    gap: SPACING.three,
  },
});

export type { ChangeMechanicProps };
