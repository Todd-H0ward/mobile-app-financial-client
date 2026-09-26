import type { WatcherGameState, WatcherLine } from '../../model/dialogue';

export const pickLine = (
  lines: WatcherLine[],
  state: WatcherGameState,
): WatcherLine => {
  const matchingLines = lines.filter((line) => {
    const cond = line.condition;

    if (cond.phases && cond.phases.length > 0) {
      if (!cond.phases.includes(state.phase)) return false;
    }

    if (cond.minCharge !== undefined) {
      if (state.charge < cond.minCharge) return false;
    }

    if (cond.maxCharge !== undefined) {
      if (state.charge > cond.maxCharge) return false;
    }

    if (cond.hasActiveTask !== undefined) {
      if (state.hasActiveTask !== cond.hasActiveTask) return false;
    }

    if (cond.areNeedsMet !== undefined) {
      if (state.areNeedsMet !== cond.areNeedsMet) return false;
    }

    return true;
  });

  if (matchingLines.length === 0) {
    const fallbackLine = lines.find((line) => line.id === 'default');
    if (fallbackLine) {
      return fallbackLine;
    }
    return lines[0] as WatcherLine;
  }

  matchingLines.sort((a, b) => b.priority - a.priority);

  return matchingLines[0] as WatcherLine;
};
