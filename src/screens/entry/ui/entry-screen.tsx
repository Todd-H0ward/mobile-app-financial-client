import { Redirect } from 'expo-router';

import { useUser } from '@/entities/user';

import { ROUTES } from '@/shared/constants';

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export const EntryScreen = () => {
  const user = useUser();

  if (!user) {
    return <Redirect href={ROUTES.ONBOARDING} />;
  }

  if (user.period.phase === 'summary') {
    return <Redirect href={ROUTES.PERIOD_SUMMARY} />;
  }

  return <Redirect href={ROUTES.HOME} />;
};
