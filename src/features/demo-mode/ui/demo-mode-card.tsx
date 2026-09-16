import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { DEMO_RUN_PERIODS } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Card, Sheet, Switch, Text } from '@/shared/ui';

import { useDemoMode } from '../model';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Temporary home for demo controls until `screens/parents` lands (wave 1 §18).
 * The card is self-contained and will move behind the arithmetic gate as-is.
 */
export const DemoModeCard = () => {
  const { t } = useTranslation();
  const {
    isDemoMode,
    periodIndex,
    finishedPeriods,
    enable,
    disable,
    runPeriods,
    resetProfile,
  } = useDemoMode();

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const onSwitchChange = (isChecked: boolean) => {
    if (isChecked) {
      // Nothing is lost any more, but swapping the profile under a child is
      // still a thing a grown-up should confirm rather than discover.
      setIsConfirmVisible(true);
      return;
    }

    disable();
  };

  const confirmEnable = () => {
    setIsConfirmVisible(false);
    enable();
  };

  return (
    <>
      <Card tone="surfaceSoft">
        <Card.Title>{t('demoMode.title')}</Card.Title>
        <Card.Content style={styles.content}>
          <Switch
            isChecked={isDemoMode}
            onChange={onSwitchChange}
            label={t('demoMode.switchLabel')}
          />

          <Text variant="small" themeColor="textSecondary">
            {t('demoMode.periodInfo', { periodIndex, finishedPeriods })}
          </Text>

          <Text variant="small" themeColor="textSecondary">
            {t('demoMode.desc1')}
          </Text>

          <Text variant="small" themeColor="textSecondary">
            {t('demoMode.desc2')}
          </Text>
        </Card.Content>
        <Card.Footer>
          <View style={styles.actions}>
            <Button
              size="m"
              isFullWidth
              disabled={!isDemoMode}
              onPress={runPeriods}
            >
              {t('demoMode.runPeriods', { count: DEMO_RUN_PERIODS })}
            </Button>
            <Button
              size="m"
              variant="secondary"
              isFullWidth
              disabled={!isDemoMode}
              onPress={resetProfile}
            >
              {t('demoMode.resetProfile')}
            </Button>
          </View>
        </Card.Footer>
      </Card>

      <Sheet.Modal
        isVisible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
      >
        <Sheet.Title>{t('demoMode.confirmTitle')}</Sheet.Title>
        <Sheet.Description>{t('demoMode.confirmDesc')}</Sheet.Description>
        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => setIsConfirmVisible(false)}
          >
            {t('demoMode.confirmCancel')}
          </Button>
          <Button isFullWidth onPress={confirmEnable}>
            {t('demoMode.confirmEnable')}
          </Button>
        </Sheet.Actions>
      </Sheet.Modal>
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.two,
    width: '100%',
  },
  content: {
    gap: SPACING.two,
  },
});
