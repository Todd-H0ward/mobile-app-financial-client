import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { DEMO_RUN_PERIODS } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { Button, Card, Sheet, Switch, Text } from '@/shared/ui';

import { useDemoMode } from '../model/use-demo-mode';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Temporary home for demo controls until `screens/parents` lands (wave 1 §18).
 * The card is self-contained and will move behind the arithmetic gate as-is.
 */
export const DemoModeCard = () => {
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
      // Enabling wipes the child's progress — ask first.
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
        <Card.Title>Демо-режим</Card.Title>
        <Card.Content style={styles.content}>
          <Switch
            isChecked={isDemoMode}
            onChange={onSwitchChange}
            label="Тестовый профиль"
          />

          <Text variant="small" themeColor="textSecondary">
            Период {periodIndex} · периодов в истории {finishedPeriods}
          </Text>

          <Text variant="small" themeColor="textSecondary">
            Пять периодов подряд без ожидания реального времени. Факт по
            направлениям пока нулевой — кошелёк и задания появятся позже.
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
              Прогнать {DEMO_RUN_PERIODS} периодов
            </Button>
            <Button
              size="m"
              variant="secondary"
              isFullWidth
              disabled={!isDemoMode}
              onPress={resetProfile}
            >
              Сбросить к исходному
            </Button>
          </View>
        </Card.Footer>
      </Card>

      <Sheet.Modal
        isVisible={isConfirmVisible}
        onClose={() => setIsConfirmVisible(false)}
      >
        <Sheet.Title>Включить демо-режим?</Sheet.Title>
        <Sheet.Description>
          Текущий прогресс ребёнка будет заменён тестовым профилем. Выключить
          демо-режим тоже начнёт игру заново.
        </Sheet.Description>
        <Sheet.Actions>
          <Button
            variant="ghost"
            isFullWidth
            onPress={() => setIsConfirmVisible(false)}
          >
            Отмена
          </Button>
          <Button isFullWidth onPress={confirmEnable}>
            Включить
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
