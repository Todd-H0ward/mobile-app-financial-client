import { describe, expect, it } from 'vitest';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import { finishPeriod, startPeriod } from '../period';

import {
  createDemoProfile,
  DEMO_RUN_PERIODS,
  runDemoPeriods,
  toggleDemoMode,
} from './demo';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Minimal structural check: the save has the fields that every screen depends
 * on. We avoid importing `isUserSave` from the model barrel because it
 * re-exports the store, which pulls in react-native (Flow), which Rolldown
 * cannot parse in a Node test environment.
 */
const hasValidShape = (u: unknown): boolean => {
  if (!u || typeof u !== 'object') return false;
  const s = u as Record<string, unknown>;

  return (
    typeof s.playerName === 'string' &&
    typeof s.period === 'object' &&
    s.period !== null &&
    typeof (s.period as Record<string, unknown>).phase === 'string' &&
    typeof s.settings === 'object' &&
    s.settings !== null &&
    typeof (s.settings as Record<string, unknown>).isDemoMode === 'boolean'
  );
};

// ═══════════════════════════════════════════
// 1. createDemoProfile returns a valid UserSave in planning
// ═══════════════════════════════════════════

describe('createDemoProfile', () => {
  const profile = createDemoProfile();

  it('passes the UserSave type guard', () => {
    expect(hasValidShape(profile)).toBe(true);
  });

  it('starts in planning phase, period 1', () => {
    expect(profile.period.phase).toBe('planning');
    expect(profile.period.index).toBe(1);
  });

  it('has isDemoMode: true', () => {
    expect(profile.settings.isDemoMode).toBe(true);
  });

  it('uses a non-empty player name', () => {
    expect(profile.playerName.length).toBeGreaterThan(0);
  });

  it('preserves grown-up sound and animation settings when provided', () => {
    const custom = createDemoProfile({
      isSoundEnabled: false,
      isAnimationEnabled: false,
    });

    expect(custom.settings.isSoundEnabled).toBe(false);
    expect(custom.settings.isAnimationEnabled).toBe(false);
  });

  it('always forces isDemoMode: true regardless of settings input', () => {
    // Even if the caller somehow passes isDemoMode: false it must be overridden.
    const forced = createDemoProfile({ isDemoMode: false });

    expect(forced.settings.isDemoMode).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 2. toggleDemoMode — enabling demo mode
// ═══════════════════════════════════════════

describe('toggleDemoMode — enabling', () => {
  const user = createInitialUser({
    playerName: 'Аня',
    settings: {
      isParentGateEnabled: true,
      isSoundEnabled: false,
      isAnimationEnabled: true,
      isDemoMode: false,
    },
  });

  const demo = toggleDemoMode(user);

  it('sets isDemoMode to true', () => {
    expect(demo.settings.isDemoMode).toBe(true);
  });

  it('resets to period 1, planning phase', () => {
    expect(demo.period.index).toBe(1);
    expect(demo.period.phase).toBe('planning');
  });

  it('preserves sound and animation settings from the grown-up', () => {
    expect(demo.settings.isSoundEnabled).toBe(false);
    expect(demo.settings.isAnimationEnabled).toBe(true);
  });

  it("replaces player name with the demo name (not the child's name)", () => {
    // The demo profile uses a fixed name, not "Аня".
    expect(demo.playerName).not.toBe('Аня');
  });

  it('produces a valid UserSave', () => {
    expect(hasValidShape(demo)).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 3. toggleDemoMode — disabling demo mode
// ═══════════════════════════════════════════

describe('toggleDemoMode — disabling', () => {
  // Start from a demo profile that has been played a bit.
  const demo = createDemoProfile({ isSoundEnabled: false });

  const restored = toggleDemoMode(demo);

  it('sets isDemoMode to false', () => {
    expect(restored.settings.isDemoMode).toBe(false);
  });

  it('resets to period 1, planning phase', () => {
    expect(restored.period.index).toBe(1);
    expect(restored.period.phase).toBe('planning');
  });

  it('preserves sound and animation settings', () => {
    expect(restored.settings.isSoundEnabled).toBe(false);
  });

  it('produces a valid UserSave', () => {
    expect(hasValidShape(restored)).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 4. Five periods back-to-back without real time
// ═══════════════════════════════════════════

describe('demo mode — five periods back-to-back', () => {
  it('runs five full periods and leaves a valid profile', () => {
    const time = makeDemoTimeSource(0);
    const user = runDemoPeriods(createDemoProfile(), time);

    // Five periods completed: index advanced 1→6.
    expect(user.period.index).toBe(1 + DEMO_RUN_PERIODS);
    expect(user.period.phase).toBe('planning');
    expect(user.history).toHaveLength(DEMO_RUN_PERIODS);
    expect(hasValidShape(user)).toBe(true);
  });

  it('starts from active and still finishes exactly five periods', () => {
    const time = makeDemoTimeSource(0);
    let user = createDemoProfile();

    user = {
      ...user,
      period: { ...user.period, plan: { needs: 10, wants: 5, savings: 5 } },
    };
    user = startPeriod(user, time);
    time.tick();

    expect(user.period.phase).toBe('active');

    user = runDemoPeriods(user, time);

    expect(user.period.index).toBe(1 + DEMO_RUN_PERIODS);
    expect(user.period.phase).toBe('planning');
    expect(user.history).toHaveLength(DEMO_RUN_PERIODS);
  });

  it('starts from summary and still finishes exactly five periods', () => {
    const time = makeDemoTimeSource(0);
    let user = createDemoProfile();

    user = {
      ...user,
      period: { ...user.period, plan: { needs: 10, wants: 5, savings: 5 } },
    };
    user = startPeriod(user, time);
    time.tick();
    user = finishPeriod(user, time);
    time.tick();

    expect(user.period.phase).toBe('summary');

    user = runDemoPeriods(user, time);

    expect(user.period.index).toBe(1 + DEMO_RUN_PERIODS);
    expect(user.period.phase).toBe('planning');
    expect(user.history).toHaveLength(DEMO_RUN_PERIODS);
  });

  it('does not depend on real time — same financial outcome with any clock seed', () => {
    const runFivePeriods = (seed: number) => {
      const time = makeDemoTimeSource(seed);
      const user = runDemoPeriods(createDemoProfile(), time);

      return user.history.map((r) => ({
        plan: r.plan,
        fact: r.fact,
        isPlanKept: r.isPlanKept,
      }));
    };

    // 30 days apart — financial outcome must be identical.
    const historyA = runFivePeriods(0);
    const historyB = runFivePeriods(30 * 24 * 60 * 60 * 1000);

    expect(historyA).toEqual(historyB);
  });

  it('keeps endedAt strictly ascending across history', () => {
    const time = makeDemoTimeSource(1000);
    const user = runDemoPeriods(createDemoProfile(), time);

    for (let i = 1; i < user.history.length; i++) {
      expect(user.history[i].endedAt).toBeGreaterThan(
        user.history[i - 1].endedAt,
      );
    }
  });
});
