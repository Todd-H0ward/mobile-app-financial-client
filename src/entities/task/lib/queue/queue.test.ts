import { describe, expect, it } from 'vitest';

import { listTasks } from '../catalogue';

import { isTaskAvailable, listOpenTasks, nextTaskId } from './queue';

// ═══════════════════════════════════════════
describe('task queue', () => {
  it('keeps catalogue order for open tasks', () => {
    const all = listTasks();
    expect(listOpenTasks([]).map((t) => t.id)).toEqual(all.map((t) => t.id));
  });

  it('skips tasks already done this period', () => {
    const first = listTasks()[0];
    expect(first).toBeDefined();
    if (!first) return;

    const open = listOpenTasks([first.id]);
    expect(open.map((t) => t.id)).not.toContain(first.id);
    expect(nextTaskId([first.id])).toBe(open[0]?.id ?? null);
  });

  it('returns null when every task is done', () => {
    const allIds = listTasks().map((t) => t.id);
    expect(listOpenTasks(allIds)).toEqual([]);
    expect(nextTaskId(allIds)).toBeNull();
  });

  it('treats every incomplete task as available — no unlock gate', () => {
    const second = listTasks()[1];
    expect(second).toBeDefined();
    if (!second) return;

    expect(isTaskAvailable(second.id, [])).toBe(true);
    expect(isTaskAvailable(second.id, [second.id])).toBe(false);
  });
});
