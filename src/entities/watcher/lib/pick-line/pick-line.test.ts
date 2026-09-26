import { describe, expect, it } from 'vitest';

import type { WatcherGameState, WatcherLine } from '../../model/dialogue';

import { pickLine } from './pick-line';

describe('pickLine', () => {
  const dummyState: WatcherGameState = {
    phase: 'planning',
    charge: 0.5,
    spirit: 0.5,
    hasActiveTask: false,
    areNeedsMet: true,
    balance: 100,
    periodIndex: 1,
    platformLevel: 1,
    moduleTier: 1,
  };

  const defaultLine: WatcherLine = {
    id: 'default',
    textKey: 'default_key',
    priority: 0,
    condition: {},
    actions: [],
  };

  it('returns highest priority matching line', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'low',
        textKey: 'low_key',
        priority: 10,
        condition: {},
        actions: [],
      },
      {
        id: 'high',
        textKey: 'high_key',
        priority: 50,
        condition: {},
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('high');
  });

  it('filters by phase correctly', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'active_only',
        textKey: 'active_key',
        priority: 50,
        condition: { phases: ['active'] },
        actions: [],
      },
      {
        id: 'planning_only',
        textKey: 'planning_key',
        priority: 10,
        condition: { phases: ['planning'] },
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('planning_only');
  });

  it('filters by charge range', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'low_charge',
        textKey: 'low_charge_key',
        priority: 50,
        condition: { maxCharge: 0.3 },
        actions: [],
      },
      {
        id: 'high_charge',
        textKey: 'high_charge_key',
        priority: 50,
        condition: { minCharge: 0.7 },
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('default');
    expect(pickLine(lines, { ...dummyState, charge: 0.2 }).id).toBe(
      'low_charge',
    );
    expect(pickLine(lines, { ...dummyState, charge: 0.8 }).id).toBe(
      'high_charge',
    );
  });

  it('filters by hasActiveTask', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'needs_task',
        textKey: 'needs_task_key',
        priority: 50,
        condition: { hasActiveTask: true },
        actions: [],
      },
      {
        id: 'no_task',
        textKey: 'no_task_key',
        priority: 50,
        condition: { hasActiveTask: false },
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('no_task');
    expect(pickLine(lines, { ...dummyState, hasActiveTask: true }).id).toBe(
      'needs_task',
    );
  });

  it('falls back to default line when nothing matches', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'impossible',
        textKey: 'impossible_key',
        priority: 50,
        condition: { minCharge: 1, maxCharge: 0 },
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('default');
  });

  it('AND logic: all defined conditions must match', () => {
    const lines: WatcherLine[] = [
      defaultLine,
      {
        id: 'strict',
        textKey: 'strict_key',
        priority: 50,
        condition: { phases: ['planning'], hasActiveTask: true },
        actions: [],
      },
    ];

    expect(pickLine(lines, dummyState).id).toBe('default');
    expect(pickLine(lines, { ...dummyState, hasActiveTask: true }).id).toBe(
      'strict',
    );
  });
});
