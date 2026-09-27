import { Redirect } from 'expo-router';

import { DYNAMIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/**
 * Old links land on the arena: the diagnostics live there, docked under the
 * dog's close-up, so the child sees the dog it is reading about.
 */
export const RobotScreen = () => (
  <Redirect href={DYNAMIC_ROUTES.robotPanel()} />
);
