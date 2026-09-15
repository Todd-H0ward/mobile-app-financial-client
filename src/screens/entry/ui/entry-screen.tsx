import { Redirect } from 'expo-router';

import { useUser } from '@/entities/user';

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export const EntryScreen = () => {
  const user = useUser();

  return <Redirect href={user ? '/home' : '/onboarding'} />;
};
