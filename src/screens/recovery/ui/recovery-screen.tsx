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

/**
 * Choosable recovery path after the period totals — 2.5.9 / roadmap 1.19.
 *
 * Options come from `pickRecoveryOptions`: one or two concrete steps, no
 * shame, no wipe. Skipping is allowed — progress is never held hostage.
 */
export const RecoveryScreen = () => {
  const { t } = useTranslation();
  const recovery = useRecovery();

  if (!recovery) {
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen gap="three">
      <Screen.Header>
        <Screen.Heading>
          <Screen.Title>
            {t('recovery.title', { period: recovery.periodIndex })}
          </Screen.Title>
          <Screen.Subtitle>{t('recovery.subtitle')}</Screen.Subtitle>
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
            onPress={() => recovery.choose(option)}
          />
        ))}
      </View>

      <Button
        variant="ghost"
        size="l"
        isFullWidth
        onPress={recovery.skip}
        style={styles.skip}
      >
        {t('recovery.skip')}
      </Button>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  list: {
    gap: SPACING.two,
  },
  skip: {
    marginTop: 'auto',
  },
});
