import { StyleSheet, View } from 'react-native';

import { ROBOT_DOG_ACTIONS, type RobotDogAction } from '@/entities/robot-dog';

import { SPACING } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Card, Chip, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotCardProps {
  action?: RobotDogAction;
  onActionChange: (action: RobotDogAction) => void;
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * What the dog does on the arena. The look — coat, ears, eyes — lives in one place, the
 * "names and look" sheet, so a second coat picker here cannot disagree with it.
 */
export const RobotCard = ({ action, onActionChange }: RobotCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Card.Title>{t('settings.robot')}</Card.Title>
      <Card.Content style={styles.content}>
        <View style={styles.heading}>
          <Text variant="bodyBold">{t('settings.robotAction')}</Text>
          <Text variant="small" themeColor="textMuted">
            {t('settings.robotActionSubtitle')}
          </Text>
        </View>
        <View style={styles.actions}>
          {ROBOT_DOG_ACTIONS.map((value) => (
            <Chip
              key={value}
              variant={value === action ? 'selected' : 'neutral'}
              onPress={() => onActionChange(value)}
            >
              {t(`settings.action.${value}`)}
            </Chip>
          ))}
        </View>
        <Text variant="small" themeColor="textMuted">
          {t('settings.robotTapHint')}
        </Text>
      </Card.Content>
    </Card>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.TWO,
  },
  content: {
    gap: SPACING.COMPACT,
  },
  heading: { gap: 2 },
});

export type { RobotCardProps };
