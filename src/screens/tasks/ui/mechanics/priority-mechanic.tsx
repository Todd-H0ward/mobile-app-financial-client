import { Pressable, StyleSheet, View } from 'react-native';

import type { PriorityPayload } from '@/entities/task';

import { RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Text } from '@/shared/ui';
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

const KEY_SIZE = 36;

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Reorder the list — needs should sit above wants.
 *
 * Up/down keys rather than drag: same rule, works with a screen reader.
 */
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
                    backgroundColor:
                      index === 0 ? theme.disabled : theme.surfaceSoft,
                    borderColor: theme.borderStrong,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text variant="bodyBold">↑</Text>
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
                    backgroundColor:
                      index === orderedIds.length - 1
                        ? theme.disabled
                        : theme.surfaceSoft,
                    borderColor: theme.borderStrong,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text variant="bodyBold">↓</Text>
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
    borderWidth: 1,
    height: KEY_SIZE,
    justifyContent: 'center',
    width: KEY_SIZE,
  },
  keys: {
    flexDirection: 'row',
    gap: SPACING.one,
  },
  root: {
    gap: SPACING.two,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 1,
    flexDirection: 'row',
    gap: SPACING.two,
    padding: SPACING.two,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});

export type { PriorityMechanicProps };
