import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { ROUTES, SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Screen, Text } from '@/shared/ui';
import { formatMoney } from '@/shared/utils';

import { useEndPeriodConfirm } from '../model';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * Soft confirm before ending the day — never blocks the action (0.3-R).
 *
 * When planned needs are still open, the card names the gap; the child can
 * still finish and read the totals. Shame is not a mechanic.
 */
export const EndPeriodScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const confirm = useEndPeriodConfirm();

  if (!confirm) {
    return <Redirect href={ROUTES.HOME} />;
  }

  return (
    <Screen gap="three" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Title>
            {t('endPeriod.title', { period: confirm.periodIndex })}
          </Screen.Title>
          <Screen.Subtitle>{t('endPeriod.subtitle')}</Screen.Subtitle>
        </Screen.Heading>
        <HintButton screen="end-period" />
      </Screen.Header>

      <Text themeColor="textSecondary">{t('endPeriod.lead')}</Text>

      {confirm.isNeedsShort && (
        <Card
          tone="surfaceSoft"
          style={[styles.warn, { borderColor: theme.warning }]}
        >
          <Card.Content>
            <Text variant="bodyBold" themeColor="warningStrong">
              {t('endPeriod.warnTitle')}
            </Text>
            <Text themeColor="textSecondary">
              {t('endPeriod.warnBody', {
                count: formatMoney(confirm.needsGap),
              })}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="l"
          isFullWidth
          onPress={confirm.confirm}
        >
          {t('endPeriod.confirm')}
        </Button>
        <Button
          variant="ghost"
          size="l"
          isFullWidth
          onPress={() => router.back()}
        >
          {t('endPeriod.cancel')}
        </Button>
      </View>
    </Screen>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.two,
    marginTop: 'auto',
  },
  warn: {
    borderWidth: 1.5,
  },
});
