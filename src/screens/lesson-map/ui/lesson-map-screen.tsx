import { useCallback, useRef } from 'react';

import { useFocusEffect, useRouter } from 'expo-router';

import { lessonAccess, lessonCellKey, listLessons } from '@/entities/lesson';
import { useUser } from '@/entities/user';

import { DYNAMIC_ROUTES } from '@/shared/constants';
import { useTranslation } from '@/shared/i18n';
import { Button, Screen, Text } from '@/shared/ui';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const STATUS_ICON = {
  LOCKED: '🔒',
  AVAILABLE: '○',
  CURRENT: '➜',
  COMPLETED: '✓',
};

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════
export const LessonMapScreen = () => {
  const user = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  const isNavigating = useRef(false);
  useFocusEffect(
    useCallback(() => {
      isNavigating.current = false;
    }, []),
  );
  if (!user) return null;
  return (
    <Screen gap="two" isTabBarVisible={false}>
      <Screen.Header>
        <Screen.Back />
        <Screen.Title>{t('lessonMap.title')}</Screen.Title>
      </Screen.Header>
      <Text>{t('lessonMap.rule')}</Text>
      {listLessons().map((lesson, ordinal) => {
        const access = lessonAccess(
          ordinal,
          user.completedLessonCells,
          user.platform.level,
        );
        return (
          <Button
            key={lesson.id}
            variant={access.status === 'CURRENT' ? 'primary' : 'secondary'}
            disabled={access.status === 'LOCKED'}
            accessibilityLabel={`${ordinal + 1}. ${lesson.title}. ${t(`lessonMap.${access.status}`)}`}
            onPress={() => {
              if (isNavigating.current) return;
              isNavigating.current = true;
              router.push(DYNAMIC_ROUTES.lesson(lessonCellKey(ordinal)));
            }}
          >
            {STATUS_ICON[access.status]} {ordinal + 1}. {lesson.title} ·{' '}
            {t(`lessonMap.${access.status}`)}
            {access.status === 'LOCKED'
              ? ` · ${t('lessonMap.requires', { level: access.requiredLevel, count: access.missing })}`
              : ''}
          </Button>
        );
      })}
    </Screen>
  );
};
