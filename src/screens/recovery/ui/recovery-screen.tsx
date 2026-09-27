import { useState } from 'react';

import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, ListRow, Screen, Text } from '@/shared/ui';

import { useRecovery } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Options come from `pickRecoveryOptions`: one or two concrete steps, no shame, no wipe */
export const RecoveryScreen = () => {
  const { t } = useTranslation();
  const recovery = useRecovery();
  const [chosenId, setChosenId] = useState<string | null>(null);

  if (!recovery) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  const chosen =
    recovery.options.find((option) => option.id === chosenId) ??
    recovery.options[0];

  return (
    <Screen gap={SPACING.COMPACT} terminalVariant="keeper">
      <Screen.Header>
        <Screen.Heading>
          <Screen.Label>{t('recovery.label')}</Screen.Label>
          <Screen.Title>{t('recovery.heading')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="recovery" />
      </Screen.Header>

      <Text themeColor="textSecondary">{t('recovery.lead')}</Text>

      <View style={styles.list}>
        {recovery.options.map((option) => (
          <ListRow
            key={option.id}
            title={t(`recovery.options.${option.id}.title`)}
            subtitle={t(`recovery.options.${option.id}.body`)}
            isSelected={option.id === chosen?.id}
            onPress={() => setChosenId(option.id)}
          />
        ))}
      </View>

      <Screen.Footer>
        <Button
          size="l"
          isFullWidth
          disabled={!chosen}
          onPress={() => {
            if (chosen) recovery.choose(chosen);
          }}
        >
          {t('recovery.start', { period: recovery.periodIndex + 1 })}
        </Button>
        <Button variant="ghost" size="s" isFullWidth onPress={recovery.skip}>
          {t('recovery.skip')}
        </Button>
      </Screen.Footer>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  list: {
    gap: SPACING.TWO,
  },
});
