import { Redirect } from 'expo-router';

import { useUser } from '@/entities/user';

import { ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export const EntryScreen = () => {
  const user = useUser();

  return <Redirect href={user ? ROUTES.HOME : ROUTES.ONBOARDING} />;
};
