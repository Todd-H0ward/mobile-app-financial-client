import { StyleSheet, View } from 'react-native';

import type { ChangePayload } from '@/entities/task';

import { FONTS, RADII, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
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

export const ChangeMechanic = ({
  payload,
  selectedId,
  onSelect,
}: ChangeMechanicProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.tiles}>
        {[
          { key: 'price', value: formatMoney(payload.price) },
          { key: 'paid', value: formatMoney(payload.paid) },
          { key: 'change', value: '?' },
        ].map((tile) => {
          const isUnknown = tile.key === 'change';
          return (
            <View
              key={tile.key}
              style={[
                styles.tile,
                {
                  borderColor: isUnknown ? theme.phosphor : theme.border,
                },
                isUnknown && styles.dashed,
              ]}
            >
              <Text variant="small" themeColor="textMuted">
                {t(`tasks.change.${tile.key}`)}
              </Text>
              <Text
                variant={isUnknown ? 'machine' : 'code'}
                style={styles.tileValue}
              >
                {tile.value}
              </Text>
            </View>
          );
        })}
      </View>
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
  dashed: { borderStyle: 'dashed' },
  options: {
    gap: SPACING.TWO,
  },
  root: {
    gap: SPACING.COMPACT,
  },
  tile: {
    alignItems: 'center',
    borderRadius: RADII.m,
    borderWidth: 2,
    flex: 1,
    paddingVertical: SPACING.COMPACT,
  },
  tileValue: { fontFamily: FONTS.monoStrong, fontSize: 25, lineHeight: 32 },
  tiles: { flexDirection: 'row', gap: SPACING.TWO },
});

export type { ChangeMechanicProps };
