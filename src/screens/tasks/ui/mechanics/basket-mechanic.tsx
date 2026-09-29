import { Pressable, StyleSheet, View } from 'react-native';

import { Sprite } from '@/entities/sprite/ui';
import type { BasketPayload } from '@/entities/task';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { PixelIcon, ProgressBar, Text } from '@/shared/ui';
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
// CONSTANTS
// ═══════════════════════════════════════════

const CELLS = 10;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const BasketMechanic = ({
  payload,
  selectedIds,
  onToggle,
}: BasketMechanicProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const selected = new Set(selectedIds);
  const total = payload.items
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  const isOver = total > payload.budget;
  const filled = payload.budget > 0 ? Math.min(1, total / payload.budget) : 0;

  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {payload.items.map((item) => {
          const isPicked = selected.has(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isPicked }}
              accessibilityLabel={`${item.title}, ${formatMoney(item.price)}`}
              onPress={() => onToggle(item.id)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor:
                    isPicked || pressed ? theme.surfaceSoft : theme.surface,
                  borderColor: isPicked ? theme.phosphor : theme.border,
                },
              ]}
            >
              {isPicked ? (
                <View style={styles.check}>
                  <PixelIcon name="check" size={12} />
                </View>
              ) : null}
              {item.sprite ? <Sprite name={item.sprite} size={40} /> : null}
              <Text variant="bodyBold" style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text style={styles.price}>{formatMoney(item.price)}</Text>
            </Pressable>
          );
        })}
        {payload.items.length % 2 === 1 ? <View style={styles.filler} /> : null}
      </View>

      <View style={styles.total}>
        <Text themeColor="textSecondary">{t('tasks.basket.inBasket')}</Text>
        <Text variant="machine" themeColor={isOver ? 'warning' : 'phosphor'}>
          {`${formatMoney(total)} / ${formatMoney(payload.budget)}`}
        </Text>
      </View>
      <ProgressBar
        value={filled}
        segmentCount={CELLS}
        height={12}
        color={isOver ? 'warning' : 'primary'}
        trackColor="surfaceSoft"
      />
      {isOver ? (
        <Text variant="smallBold" themeColor="warning">
          {`! ${t('tasks.basket.over')}`}
        </Text>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  check: { position: 'absolute', right: 10, top: 10 },
  filler: { flexBasis: '46%', flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.TWO },
  item: {
    borderRadius: RADII.m,
    borderWidth: 2,
    flexBasis: '46%',
    flexGrow: 1,
    gap: SPACING.ONE,
    minHeight: 76,
    padding: SPACING.COMPACT,
  },
  itemTitle: { paddingRight: SPACING.THREE },
  price: { fontFamily: FONTS.monoStrong, fontSize: 16, lineHeight: 22 },
  root: { gap: SPACING.TWO },
  total: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.ONE,
  },
});

export type { BasketMechanicProps };
