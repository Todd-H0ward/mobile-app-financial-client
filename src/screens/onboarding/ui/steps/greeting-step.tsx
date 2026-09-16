import { StyleSheet, View } from 'react-native';

import { listDecisions } from '@/entities/onboarding';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, Text } from '@/shared/ui';

import { DecisionBasket } from '../decision-basket';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export const GreetingStep = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.boxes}>
        {listDecisions().map((decision) => (
          <DecisionBasket
            key={decision.id}
            direction={decision.id}
            title={decision.title}
            example={decision.example}
          />
        ))}
      </View>

      <Card tone="surfaceSoft">
        <Card.Content>
          <Text variant="small" themeColor="textSecondary">
            {t('onboarding.privacyNote')}
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
  boxes: {
    flexDirection: 'row',
    gap: SPACING.two,
  },
  root: {
    gap: SPACING.two,
  },
});
