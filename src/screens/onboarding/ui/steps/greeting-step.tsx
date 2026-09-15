import { StyleSheet, View } from 'react-native';

import { listDecisions } from '@/entities/onboarding';

import { SPACING } from '@/shared/constants';
import { Card, Text } from '@/shared/ui';

import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const GreetingStep = () => {
  return (
    <View style={styles.root}>
      {listDecisions().map((decision) => (
        <DecisionBasket
          key={decision.id}
          direction={decision.id}
          title={decision.title}
          example={decision.example}
        />
      ))}

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            Аккаунт не нужен: игра остаётся на этом устройстве и никуда ничего
            не отправляет.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    gap: SPACING.two,
  },
});
