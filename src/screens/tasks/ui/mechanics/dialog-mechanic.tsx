import { StyleSheet, View } from 'react-native';

import type { DialogPayload } from '@/entities/task';

import { SPACING } from '@/shared/constants';
import { ListRow, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface DialogMechanicProps {
  payload: DialogPayload;
  selectedId: string | null;
  onSelect: (choiceId: string) => void;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Pick a reply — every choice is valid; the consequence teaches. */
export const DialogMechanic = ({
  payload,
  selectedId,
  onSelect,
}: DialogMechanicProps) => {
  const selected = payload.choices.find((choice) => choice.id === selectedId);

  return (
    <View style={styles.root}>
      <Text variant="bodyBold">{payload.prompt}</Text>
      <View style={styles.list}>
        {payload.choices.map((choice) => (
          <ListRow
            key={choice.id}
            title={choice.label}
            isSelected={selectedId === choice.id}
            onPress={() => onSelect(choice.id)}
          />
        ))}
      </View>
      {selected ? (
        <Text themeColor="textSecondary">{selected.consequence}</Text>
      ) : null}
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
    gap: SPACING.three,
  },
});

export type { DialogMechanicProps };
