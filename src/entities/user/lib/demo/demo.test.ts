import { describe, expect, it } from 'vitest';

import { makeDemoTimeSource } from '@/shared/lib/time-source';

import { createInitialUser } from '../../model/initial-user';
import { finishPeriod, startPeriod } from '../period';

import {
  createDemoProfile,
  DEMO_RUN_PERIODS,
  enterDemoMode,
  exitDemoMode,
  runDemoPeriods,
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
// 2. enterDemoMode — the child's save is parked, not wiped
// ═══════════════════════════════════════════

describe('enterDemoMode', () => {
  const user = createInitialUser({
    playerName: 'Аня',
    pet: { name: 'Барсик', species: 'dog' },
    settings: {
      isParentGateEnabled: true,
      isSoundEnabled: false,
      isAnimationEnabled: true,
      isDemoMode: false,
    },
  });

  const { profile, parked } = enterDemoMode(user);

  it('hands the demo profile out in demo mode', () => {
    expect(profile.settings.isDemoMode).toBe(true);
    expect(hasValidShape(profile)).toBe(true);
  });

  it('starts the demo at period 1, planning phase', () => {
    expect(profile.period.index).toBe(1);
    expect(profile.period.phase).toBe('planning');
  });

  it('preserves sound and animation settings from the grown-up', () => {
    expect(profile.settings.isSoundEnabled).toBe(false);
    expect(profile.settings.isAnimationEnabled).toBe(true);
  });

  it("does not play under the child's name", () => {
    expect(profile.playerName).not.toBe('Аня');
    expect(profile.pet.name).not.toBe('Барсик');
  });

  it("parks the child's save untouched", () => {
    expect(parked).toEqual(user);
  });
});

// ═══════════════════════════════════════════
// 3. exitDemoMode — the child gets their own profile back
// ═══════════════════════════════════════════

describe('exitDemoMode', () => {
  const user = createInitialUser({
    playerName: 'Аня',
    pet: { name: 'Барсик', species: 'dog' },
  });

  it('gives the parked save back, name, pet and progress included', () => {
    const played = {
      ...user,
      wallet: { ...user.wallet, balance: 137 },
      period: { ...user.period, index: 4 },
    };

    const { profile, parked } = enterDemoMode(played);
    const restored = exitDemoMode(parked, profile);

    expect(restored.playerName).toBe('Аня');
    expect(restored.pet.name).toBe('Барсик');
    expect(restored.wallet.balance).toBe(137);
    expect(restored.period.index).toBe(4);
    expect(restored.settings.isDemoMode).toBe(false);
  });

  it('carries the device settings the grown-up left on during the demo', () => {
    const { profile, parked } = enterDemoMode(user);
    const muted = {
      ...profile,
      settings: { ...profile.settings, isSoundEnabled: false },
    };

    expect(exitDemoMode(parked, muted).settings.isSoundEnabled).toBe(false);
  });

  it('never leaves the demo name behind when there is nothing parked', () => {
    const demo = createDemoProfile();
    const restored = exitDemoMode(null, demo);

    expect(restored.playerName).not.toBe(demo.playerName);
    expect(restored.pet.name).not.toBe(demo.pet.name);
    expect(restored.settings.isDemoMode).toBe(false);
    expect(hasValidShape(restored)).toBe(true);
  });

  it('leaves the demo profile itself alone — the restore is pure', () => {
    const { profile, parked } = enterDemoMode(user);
    const before = JSON.stringify(profile);

    exitDemoMode(parked, profile);

    expect(JSON.stringify(profile)).toBe(before);
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
