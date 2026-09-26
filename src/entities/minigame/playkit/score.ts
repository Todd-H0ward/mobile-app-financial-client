import type { PlaykitRound } from './rounds';

/** Whether the child's locked answer matches the round. */
export const isPlaykitAnswerCorrect = (
  round: PlaykitRound,
  answer: unknown,
): boolean => {
  if (round.kind === 'conveyor') return answer === round.correctBin;
  if (round.kind === 'scales') {
    if (!answer || typeof answer !== 'object') return false;
    const value = answer as { needs?: number; wants?: number };
    return (
      value.needs === round.targetNeeds && value.wants === round.targetWants
    );
  }
  if (round.kind === 'cashier') return answer === round.change;
  if (round.kind === 'jar') {
    if (!Array.isArray(answer)) return false;
    const got = [...answer].map(Number).sort((a, b) => a - b);
    const want = [...round.goodSlots].sort((a, b) => a - b);
    return got.length === want.length && got.every((v, i) => v === want[i]);
  }
  if (round.kind === 'pinball') return answer === round.target;
  if (round.kind === 'memory') return answer === true;
  if (round.kind === 'path') {
    if (!Array.isArray(answer)) return false;
    return (
      answer.length === round.solution.length &&
      answer.every((v, i) => v === round.solution[i])
    );
  }
  if (round.kind === 'assemble') {
    if (!Array.isArray(answer)) return false;
    return (
      answer.length === round.map.length &&
      answer.every((slot, i) => slot === round.map[i])
    );
  }
  if (round.kind === 'laser') {
    if (!Array.isArray(answer)) return false;
    const got = [...answer].map(Number).sort((a, b) => a - b);
    const want = [...round.waste].sort((a, b) => a - b);
    return got.length === want.length && got.every((v, i) => v === want[i]);
  }
  if (round.kind === 'orbit') {
    if (typeof answer !== 'number') return false;
    return answer >= round.windowStart && answer <= round.windowEnd;
  }
  return false;
};

export const playkitAnswerLabel = (
  round: PlaykitRound,
  answer: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  if (round.kind === 'conveyor' && typeof answer === 'string') {
    return t(`playkit.bins.${answer}`);
  }
  if (round.kind === 'scales' && answer && typeof answer === 'object') {
    const value = answer as { needs?: number; wants?: number };
    return `${value.needs ?? 0} / ${value.wants ?? 0}`;
  }
  if (typeof answer === 'number') return String(answer);
  if (typeof answer === 'boolean') {
    return answer ? t('playkit.ok') : t('playkit.miss');
  }
  if (Array.isArray(answer)) return answer.join(', ');
  return t('playkit.miss');
};

export const playkitCorrectLabel = (
  round: PlaykitRound,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string => {
  if (round.kind === 'conveyor') return t(`playkit.bins.${round.correctBin}`);
  if (round.kind === 'scales') {
    return `${round.targetNeeds} / ${round.targetWants}`;
  }
  if (round.kind === 'cashier') return String(round.change);
  if (round.kind === 'jar') return round.goodSlots.join(', ');
  if (round.kind === 'pinball') return String(round.target + 1);
  if (round.kind === 'memory') return t('playkit.ok');
  if (round.kind === 'path') return round.solution.join(' → ');
  if (round.kind === 'assemble') return round.slots.join(' · ');
  if (round.kind === 'laser') return round.waste.join(', ');
  if (round.kind === 'orbit') {
    return `${Math.round(round.windowStart * 100)}–${Math.round(round.windowEnd * 100)}%`;
  }
  return '';
};
