import { Redirect, useLocalSearchParams } from 'expo-router';

import { TaskRouteScreen } from '@/screens/tasks';

import { DYNAMIC_ROUTES } from '@/shared/constants';

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
    return <Redirect href={DYNAMIC_ROUTES.watcher('overseer', 'trials')} />;
  }

  return <TaskRouteScreen taskId={taskId} />;
}
