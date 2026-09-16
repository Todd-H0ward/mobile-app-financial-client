import { describe, expect, it } from 'vitest';

import { getGoalById, listGoals } from '@/entities/goal';
import { listTasks, rewardForTask } from '@/entities/task';

import type { SavingsSave } from '../../model';

import { explainShortage } from './shortage';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const savingsWith = (goalId: string, saved: number): SavingsSave => ({
  goals: listGoals().map((goal) => ({
    goalId: goal.id,
    saved: goal.id === goalId ? saved : 0,
    reachedInPeriod: null,
  })),
  activeGoalId: goalId,
  depositsThisPeriod: 0,
});

// ═══════════════════════════════════════════
describe('explainShortage', () => {
  it('names the shortfall from price and balance', () => {
    const explain = explainShortage({
      shortfall: 12,
      price: 40,
      balance: 28,
      savings: savingsWith('scooter', 0),
    });

    expect(explain.shortfall).toBe(12);
    expect(explain.price).toBe(40);
    expect(explain.balance).toBe(28);
  });

  it('suggests the cheapest task that covers the gap', () => {
    const shortfall = 12;
    const covering = listTasks()
      .map((task) => ({ task, reward: rewardForTask(task) }))
      .filter((row) => row.reward >= shortfall)
      .sort((a, b) => a.reward - b.reward)[0];

    const explain = explainShortage({
      shortfall,
      price: 40,
      balance: 28,
      savings: savingsWith('scooter', 0),
    });

    expect(explain.task).not.toBeNull();
    expect(explain.task?.taskId).toBe(covering.task.id);
    expect(explain.task?.reward).toBe(covering.reward);
    expect(explain.task?.coversShortfall).toBe(true);
  });

  it('falls back to the richest task when none cover the gap', () => {
    const richest = listTasks()
      .map((task) => ({ task, reward: rewardForTask(task) }))
      .sort((a, b) => b.reward - a.reward)[0];

    const explain = explainShortage({
      shortfall: richest.reward + 50,
      price: richest.reward + 50,
      balance: 0,
      savings: savingsWith('scooter', 0),
    });

    expect(explain.task?.taskId).toBe(richest.task.id);
    expect(explain.task?.coversShortfall).toBe(false);
  });

  it('shows jar consequence when the active goal holds enough', () => {
    const scooter = getGoalById('scooter');
    expect(scooter).toBeDefined();
    if (!scooter) return;

    const saved = 55;
    const shortfall = 12;
    const explain = explainShortage({
      shortfall,
      price: 40,
      balance: 28,
      savings: savingsWith('scooter', saved),
    });

    expect(explain.jar.isAvailable).toBe(true);
    expect(explain.jar.goalTitle).toBe(scooter.title);
    expect(explain.jar.remainingBefore).toBe(scooter.price - saved);
    expect(explain.jar.remainingAfter).toBe(
      scooter.price - (saved - shortfall),
    );
  });

  it('marks the jar unavailable when savings are short', () => {
    const explain = explainShortage({
      shortfall: 12,
      price: 40,
      balance: 28,
      savings: savingsWith('scooter', 5),
    });

    expect(explain.jar.isAvailable).toBe(false);
    expect(explain.jar.remainingAfter).toBeNull();
  });

  it('always offers the wait option', () => {
    const explain = explainShortage({
      shortfall: 1,
      price: 10,
      balance: 9,
      savings: savingsWith('paints', 0),
    });

    expect(explain.wait.kind).toBe('wait');
  });
});
