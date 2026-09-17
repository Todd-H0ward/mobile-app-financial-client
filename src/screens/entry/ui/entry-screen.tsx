import { Redirect } from 'expo-router';

import { useUser } from '@/entities/user';

import { STATIC_ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export const EntryScreen = () => {
  const user = useUser();

  if (!user) {
    return <Redirect href={STATIC_ROUTES.ONBOARDING} />;
  }

  if (user.period.phase === 'summary') {
    return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;
  }

  return <Redirect href={STATIC_ROUTES.HOME} />;
};
