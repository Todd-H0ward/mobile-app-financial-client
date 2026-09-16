import { StyleSheet, View } from 'react-native';

import { DIRECTION_LOOK } from '@/widgets/direction-look';

import type { CatalogueItem } from '@/entities/catalogue';
import { directionForKind } from '@/entities/catalogue';

import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { CoinBadge, ListRow, Shape, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ProductRowProps {
  item: CatalogueItem;
  /** Whether the wallet can pay for it right now. */
  canAfford: boolean;
  onPress: () => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * One catalogue card: title, note, direction marker, price.
 */
export const ProductRow = ({ item, canAfford, onPress }: ProductRowProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const direction = directionForKind(item.kind);
  const look = DIRECTION_LOOK[direction];
  const note =
    t(`shop.items.${item.id}.note`, { defaultValue: item.note ?? '' }) ||
    item.note;

  return (
    <ListRow
      title={t(`shop.items.${item.id}.title`, { defaultValue: item.title })}
      subtitle={note}
      onPress={onPress}
      icon={
        <ListRow.Icon tone={look.surface}>
          <Shape variant={look.marker} size={22} color={theme[look.accent]} />
        </ListRow.Icon>
      }
      trailing={
        <View style={styles.trailing}>
          <CoinBadge amount={item.price} coinSize={16} />
          {!canAfford && (
            <Text variant="label" themeColor="textMuted">
              {t('shop.notEnough')}
            </Text>
          )}
        </View>
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

export type { ProductRowProps };
