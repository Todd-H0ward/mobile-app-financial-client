import { useCallback, useRef } from 'react';

import { useFocusEffect, useRouter } from 'expo-router';

import {
  activeLessonIndexForCell,
  cellOrdinalForLessonIndex,
  type LessonStatus,
  lessonAccess,
  lessonCellKey,
  listLessons,
} from '@/entities/lesson';
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
      {listLessons().map((lesson, index) => {
        const cellOrdinal = cellOrdinalForLessonIndex(index);
        const cellAccess = lessonAccess(
          cellOrdinal,
          user.completedLessonIds,
          user.platform.level,
        );
        const isDone = user.completedLessonIds.includes(lesson.id);
        const isActive =
          activeLessonIndexForCell(cellOrdinal, user.completedLessonIds) ===
          index;
        const status: LessonStatus = isDone
          ? 'COMPLETED'
          : cellAccess.status === 'LOCKED' || !isActive
            ? 'LOCKED'
            : cellAccess.status;
        return (
          <Button
            key={lesson.id}
            variant={status === 'CURRENT' ? 'primary' : 'secondary'}
            disabled={status === 'LOCKED'}
            accessibilityLabel={`${index + 1}. ${lesson.title}. ${t(`lessonMap.${status}`)}`}
            onPress={() => {
              if (isNavigating.current) return;
              isNavigating.current = true;
              router.push(DYNAMIC_ROUTES.lesson(lessonCellKey(cellOrdinal)));
            }}
          >
            {STATUS_ICON[status]} {index + 1}. {lesson.title} ·{' '}
            {t(`lessonMap.${status}`)}
            {status === 'LOCKED'
              ? ` · ${t('lessonMap.requires', { level: cellAccess.requiredLevel, count: cellAccess.missing })}`
              : ''}
          </Button>
        );
      })}
    </Screen>
  );
};
