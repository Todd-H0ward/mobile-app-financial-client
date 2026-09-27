import { Pressable, StyleSheet, View } from 'react-native';

import type { PriorityPayload } from '@/entities/task';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { PixelIcon, Text } from '@/shared/ui';
import { hitSlopFor } from '@/shared/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface PriorityMechanicProps {
  payload: PriorityPayload;
  orderedIds: readonly string[];
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const KEY_SIZE = 48;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Up/down keys rather than drag: same rule, works with a screen reader */
export const PriorityMechanic = ({
  payload,
  orderedIds,
  onMoveUp,
  onMoveDown,
}: PriorityMechanicProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const byId = new Map(payload.items.map((item) => [item.id, item]));

  return (
    <View style={styles.root}>
      <Text themeColor="textSecondary">{t('tasks.priority.hint')}</Text>
      {orderedIds.map((id, index) => {
        const item = byId.get(id);
        if (!item) return null;

        return (
          <View
            key={id}
            style={[
              styles.row,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text variant="machine" style={styles.index}>
              {String(index + 1)}
            </Text>
            <PixelIcon name={item.kind === 'need' ? 'battery' : 'gear'} />
            <View style={styles.text}>
              <Text variant="bodyBold">{item.title}</Text>
              <Text variant="small" themeColor="textMuted">
                {t(`tasks.priority.${item.kind}`)}
              </Text>
            </View>
            <View style={styles.keys}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('tasks.priority.moveUp')}
                disabled={index === 0}
                hitSlop={hitSlopFor(KEY_SIZE)}
                onPress={() => onMoveUp(id)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: pressed ? theme.surfaceSoft : undefined,
                    borderColor:
                      index === 0 ? theme.border : theme.borderStrong,
                  },
                ]}
              >
                <Text
                  variant="bodyBold"
                  themeColor={index === 0 ? 'borderStrong' : 'phosphor'}
                >
                  ↑
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('tasks.priority.moveDown')}
                disabled={index === orderedIds.length - 1}
                hitSlop={hitSlopFor(KEY_SIZE)}
                onPress={() => onMoveDown(id)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: pressed ? theme.surfaceSoft : undefined,
                    borderColor:
                      index === orderedIds.length - 1
                        ? theme.border
                        : theme.borderStrong,
                  },
                ]}
              >
                <Text
                  variant="bodyBold"
                  themeColor={
                    index === orderedIds.length - 1
                      ? 'borderStrong'
                      : 'phosphor'
                  }
                >
                  ↓
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  key: {
    alignItems: 'center',
    borderRadius: RADII.s,
    borderWidth: 2,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  index: { minWidth: 14 },
  keys: {
    flexDirection: 'row',
    gap: SPACING.ONE,
  },
  root: {
    gap: SPACING.TWO,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.TWO,
    padding: SPACING.TWO,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});

export type { PriorityMechanicProps };
