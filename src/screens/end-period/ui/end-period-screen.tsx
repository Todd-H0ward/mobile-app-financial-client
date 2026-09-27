import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HintButton } from '@/widgets/hint-button';

import { RADII, SPACING, STATIC_ROUTES } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Text } from '@/shared/ui';
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
    return <Redirect href={STATIC_ROUTES.HOME} />;
  }

  return (
    <Screen presentation="sheet" gap="compact">
      <Screen.Header>
        <Screen.Back />
        <Screen.Heading>
          <Screen.Label>
            {t('endPeriod.label', { period: confirm.periodIndex })}
          </Screen.Label>
          <Screen.Title>{t('endPeriod.title')}</Screen.Title>
        </Screen.Heading>
        <HintButton screen="end-period" />
      </Screen.Header>

      <Text themeColor="textSecondary">{t('endPeriod.lead')}</Text>

      {confirm.isNeedsShort && (
        <View style={[styles.warn, { borderColor: theme.warning }]}>
          <Text variant="machine" themeColor="warning">
            !
          </Text>
          <Text style={styles.warnText}>
            {t('endPeriod.warnBody', {
              count: formatMoney(confirm.needsGap),
            })}
          </Text>
        </View>
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
          variant="secondary"
          size="m"
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
    marginTop: SPACING.two,
  },
  warn: {
    borderRadius: RADII.m,
    borderStyle: 'dashed',
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.compact,
    padding: SPACING.compact,
  },
  warnText: { flex: 1 },
});
