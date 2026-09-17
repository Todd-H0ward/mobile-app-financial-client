import { StyleSheet, View } from 'react-native';

import type { BasketPayload } from '@/entities/task';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { ListRow, ProgressBar, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface BasketMechanicProps {
  payload: BasketPayload;
  selectedIds: readonly string[];
  onToggle: (itemId: string) => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Toggle items into a basket — stay under the budget. */
export const BasketMechanic = ({
  payload,
  selectedIds,
  onToggle,
}: BasketMechanicProps) => {
  const { t } = useTranslation();
  const selected = new Set(selectedIds);
  const total = payload.items
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  const over = total > payload.budget;
  const filled = payload.budget > 0 ? Math.min(1, total / payload.budget) : 0;

  return (
    <View style={styles.root}>
      <Text variant="bodyBold">
        {t('tasks.basket.budget', { count: formatMoney(payload.budget) })}
      </Text>
      <ProgressBar value={filled} height={10} />
      <Text themeColor={over ? 'warningStrong' : 'textSecondary'}>
        {t('tasks.basket.total', { count: formatMoney(total) })}
        {over ? ` — ${t('tasks.basket.over')}` : ''}
      </Text>
      <View style={styles.list}>
        {payload.items.map((item) => (
          <ListRow
            key={item.id}
            title={item.title}
            subtitle={formatMoney(item.price)}
            isSelected={selected.has(item.id)}
            onPress={() => onToggle(item.id)}
            trailing={
              <Text variant="smallBold">{formatMoney(item.price)}</Text>
            }
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
  list: {
    gap: SPACING.two,
  },
  root: {
    gap: SPACING.two,
  },
});

export type { BasketMechanicProps };
