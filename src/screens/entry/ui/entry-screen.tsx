import { useEffect } from 'react';

import { Redirect } from 'expo-router';

import { hasSeenStory, useCreateUser, useUser } from '@/entities/user';

import { DYNAMIC_ROUTES, STATIC_ROUTES } from '@/shared/constants';
import { useTimeSource } from '@/shared/lib';

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

/**
 * Where every launch lands: sends the child on to the right screen.
 *
 * A first launch gets a guest profile on the spot — local, nameless, no
 * sign-up (2.5.1 / docs/privacy.md) — then the introduction on `/setup`
 * before the walk/fall cutscene and the arena. Names empty means the intro
 * is still owed.
 */
export const EntryScreen = () => {
  const user = useUser();
  const createUser = useCreateUser();
  const time = useTimeSource();

  useEffect(() => {
    if (!user) createUser({ createdAt: time.now() });
  }, [user, createUser, time]);

  if (!user) return null;

  if (user.period.phase === 'summary') {
    return <Redirect href={STATIC_ROUTES.PERIOD_SUMMARY} />;
  }

  if (!user.playerName || !user.robot.name) {
    return <Redirect href={STATIC_ROUTES.SETUP} />;
  }

  if (!hasSeenStory(user, 'intro')) {
    return <Redirect href={DYNAMIC_ROUTES.story('intro')} />;
  }

  return <Redirect href={STATIC_ROUTES.HOME} />;
};
