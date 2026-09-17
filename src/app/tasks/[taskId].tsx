import { Redirect, useLocalSearchParams } from 'expo-router';

import { ROUTES } from '@/shared/constants';

import { TaskRouteScreen } from '@/screens/tasks';

const asString = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
    return value[0];
  }
  return null;
};

export default function TaskRoute() {
  const taskId = asString(
    useLocalSearchParams<{ taskId?: string | string[] }>().taskId,
  );

  if (!taskId) {
    return <Redirect href={ROUTES.TASKS} />;
  }

  return <TaskRouteScreen taskId={taskId} />;
}
