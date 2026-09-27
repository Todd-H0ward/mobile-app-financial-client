import { StyleSheet, View } from 'react-native';

import type { QuizPayload } from '@/entities/task';

import { SPACING } from '@/shared/constants';
import { ListRow, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface QuizMechanicProps {
  payload: QuizPayload;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  leadIn?: string;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const QuizMechanic = ({
  payload,
  selectedId,
  onSelect,
  leadIn,
}: QuizMechanicProps) => {
  return (
    <View style={styles.root}>
      {leadIn ? <Text themeColor="textSecondary">{leadIn}</Text> : null}
      <Text variant="bodyBold">{payload.question}</Text>
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
    gap: SPACING.TWO,
  },
  root: {
    gap: SPACING.THREE,
  },
});

export type { QuizMechanicProps };
