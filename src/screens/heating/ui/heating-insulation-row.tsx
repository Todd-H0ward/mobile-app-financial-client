import { StyleSheet, View } from 'react-native';

import type { CatalogueItem } from '@/entities/catalogue';

import { useTranslation } from '@/shared/i18n';
import { CoinBadge, ListRow, Text } from '@/shared/ui';

import type { HeatingInsulationRow } from '../model';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HeatingInsulationRowProps {
  row: HeatingInsulationRow;
  /** False outside `active` — list stays readable, buys wait. */
  canBuy: boolean;
  onBuy: (item: CatalogueItem) => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One insulation upgrade with payback at the current thermostat.
 *
 * Owned rows stay on the list so the child sees what already lowers the bill.
 * "Won't pay back" is said out loud when heat is free — house.md.
 */
export const HeatingInsulationRowView = ({
  row,
  canBuy,
  onBuy,
}: HeatingInsulationRowProps) => {
  const { t } = useTranslation();
  const { item, isOwned, payback, canAfford: hasCoins } = row;

  const title = t(`shop.items.${item.id}.title`, {
    defaultValue: item.title,
  });

  const paybackLabel =
    payback.kind === 'never'
      ? t('heating.paybackNever')
      : t('heating.paybackPeriods', {
          count: payback.periods,
          saving: payback.savingPerPeriod,
        });

  const subtitle = isOwned
    ? t('heating.insulationOwned')
    : `${t(`shop.items.${item.id}.note`, { defaultValue: item.note ?? '' })} · ${paybackLabel}`;

  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      isDone={isOwned}
      onPress={
        isOwned || !canBuy
          ? undefined
          : () => {
              onBuy(item);
            }
      }
      trailing={
        isOwned ? (
          <Text variant="label" themeColor="textMuted">
            {t('heating.ownedBadge')}
          </Text>
        ) : (
          <View style={styles.trailing}>
            <CoinBadge amount={item.price} coinSize={16} />
            {!hasCoins && (
              <Text variant="label" themeColor="textMuted">
                {t('shop.notEnough')}
              </Text>
            )}
            {!canBuy && (
              <Text variant="label" themeColor="textMuted">
                {t('heating.buyWhenActive')}
              </Text>
            )}
          </View>
        )
      }
    />
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
});

export type { HeatingInsulationRowProps };
