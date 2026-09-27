import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Old links and back paths use the same catalogue as the arena dock. */
export const TasksScreen = () => (
  <Redirect href={DYNAMIC_ROUTES.watcher('overseer', 'trials')} />
);
