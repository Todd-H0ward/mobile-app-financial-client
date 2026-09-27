import { StyleSheet, View } from 'react-native';

import { GROWTH_RULES, moodFor, ROBOT_DOG_STAGES } from '@/entities/robot-dog';
import { buildParentsReport, useUser } from '@/entities/user';

import { SPACING } from '@/shared/constants';
import { useTheme } from '@/shared/hooks';
import { useTranslation } from '@/shared/i18n';
import { Button, PixelIcon, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface RobotDiagnosticsProps {
  onClose: () => void;
  onModules: () => void;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const CONDITIONS = ['periods', 'goalsReached', 'plansKept'] as const;

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/**
 * The dog's diagnostics (screen 10): mood with its cause, then the three build stages with
 * the checklist of the next one.
 */
export const RobotDiagnostics = ({
  onClose,
  onModules,
}: RobotDiagnosticsProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // Read here, not on the home screen: the arena must not re-render on every save change
  // just because the panel could open.
  const user = useUser();
  if (!user) return null;
  const mood = moodFor(user.robot.charge, user.robot.spirit);
  const { growth } = buildParentsReport(user);
  const currentIndex = ROBOT_DOG_STAGES.indexOf(growth.stage);
  const isHappy = mood.name === 'proud' || mood.name === 'content';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Button
          variant="icon"
          accessibilityLabel={t('common.back')}
          onPress={onClose}
        >
          <PixelIcon name="back" />
        </Button>
        <View style={styles.heading}>
          <Text variant="machine">{`> ${t('diagnosis.label')}`}</Text>
          <Text variant="title">{user.robot.name || t('robot.unnamed')}</Text>
        </View>
      </View>

      <View
        style={[
          styles.mood,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: isHappy ? theme.phosphor : theme.warning,
          },
        ]}
      >
        {isHappy ? (
          <PixelIcon name="check20" size={20} />
        ) : (
          <Text variant="machine" themeColor="warning">
            !
          </Text>
        )}
        <View style={styles.copy}>
          <Text variant="bodyBold">{t(`robot.mood.${mood.name}`)}</Text>
          <Text variant="small" themeColor="textSecondary">
            {t('diagnosis.because', {
              reason: t(`robot.reason.${mood.reason}`),
            })}
          </Text>
        </View>
      </View>

      <Text variant="bodyBold">{t('diagnosis.build')}</Text>
      <View>
        {ROBOT_DOG_STAGES.map((stage, index) => {
          const isEarned = index <= currentIndex;
          const isNext = stage === growth.progress?.next;
          return (
            <View key={stage} style={styles.stage}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.marker,
                    {
                      backgroundColor: isEarned
                        ? theme.phosphor
                        : theme.terminalScreen,
                      borderColor:
                        isEarned || isNext
                          ? theme.phosphor
                          : theme.borderStrong,
                    },
                    !isEarned && !isNext && styles.locked,
                  ]}
                >
                  {isEarned ? (
                    <PixelIcon name="check" size={12} tone="onAccent" />
                  ) : isNext ? (
                    <View
                      style={[styles.dot, { backgroundColor: theme.phosphor }]}
                    />
                  ) : null}
                </View>
                {index < ROBOT_DOG_STAGES.length - 1 ? (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: isEarned
                          ? theme.phosphor
                          : theme.border,
                      },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.stageContent}>
                <Text
                  variant={isNext ? 'bodyBold' : 'body'}
                  themeColor={isEarned || isNext ? 'text' : 'textMuted'}
                >
                  {t(`diagnosis.stage.${stage}`)}
                  {isNext ? t('diagnosis.inProgress') : ''}
                </Text>
                {isNext && growth.progress
                  ? CONDITIONS.map((condition) => {
                      const required = GROWTH_RULES[stage][condition];
                      const completed =
                        required - (growth.progress?.[condition] ?? 0);
                      return (
                        <View key={condition} style={styles.condition}>
                          <Text
                            variant="small"
                            themeColor="textSecondary"
                            style={styles.copy}
                          >
                            {t(`diagnosis.conditions.${condition}`)}
                          </Text>
                          <Text variant="machine">
                            {`${completed} / ${required}`}
                          </Text>
                        </View>
                      );
                    })
                  : null}
              </View>
            </View>
          );
        })}
      </View>

      <Text variant="small" themeColor="textMuted">
        {t('diagnosis.explanation')}
      </Text>
      <Button variant="secondary" size="m" isFullWidth onPress={onModules}>
        {t('equipment.inventory')}
      </Button>
    </View>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  condition: { alignItems: 'center', flexDirection: 'row', gap: SPACING.TWO },
  copy: { flex: 1, gap: SPACING.ONE },
  dot: { borderRadius: 5, height: 10, width: 10 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  heading: { flex: 1, gap: 2, minWidth: 0 },
  line: { flex: 1, minHeight: 16, width: 2 },
  locked: { borderStyle: 'dashed' },
  marker: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  mood: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: SPACING.COMPACT,
    padding: SPACING.COMPACT,
  },
  rail: { alignItems: 'center' },
  root: { gap: SPACING.COMPACT },
  stage: { flexDirection: 'row', gap: SPACING.COMPACT },
  stageContent: { flex: 1, gap: SPACING.ONE, paddingBottom: SPACING.THREE },
});

export type { RobotDiagnosticsProps };
