import { describe, expect, it } from 'vitest';

import {
  scoreBasket,
  scoreChange,
  scoreDialog,
  scorePriority,
  scoreQuiz,
  TASK_WRONG_SHARE,
} from './score';

// ═══════════════════════════════════════════
describe('scoreQuiz / scoreChange', () => {
  const quiz = {
    question: 'q',
    options: [
      { id: 'a', label: 'A', isCorrect: false },
      { id: 'b', label: 'B', isCorrect: true },
    ],
  };

  const change = {
    price: 30,
    paid: 50,
    options: [
      { id: 'a', label: '10', isCorrect: false },
      { id: 'b', label: '20', isCorrect: true },
    ],
  };

  it('pays full reward for the correct option', () => {
    expect(scoreQuiz(quiz, 'b')).toEqual({ isCorrect: true, rewardShare: 1 });
  });

  it('still pays a share on a miss', () => {
    expect(scoreChange(change, 'a')).toEqual({
      isCorrect: false,
      rewardShare: TASK_WRONG_SHARE,
    });
  });
});

describe('scoreBasket', () => {
  const basket = {
    budget: 40,
    items: [
      { id: 'bread', title: 'Хлеб', price: 8 },
      { id: 'toy', title: 'Игрушка', price: 25 },
      { id: 'juice', title: 'Сок', price: 15 },
    ],
  };

  it('accepts a selection under budget', () => {
    expect(scoreBasket(basket, ['bread', 'toy']).isCorrect).toBe(true);
  });

  it('rejects an empty or over-budget basket', () => {
    expect(scoreBasket(basket, []).isCorrect).toBe(false);
    // bread + toy + juice = 48 > 40
    expect(scoreBasket(basket, ['bread', 'toy', 'juice']).isCorrect).toBe(
      false,
    );
  });
});

describe('scorePriority', () => {
  const items = {
    items: [
      { id: 'food', title: 'Еда', kind: 'need' as const },
      { id: 'poster', title: 'Плакат', kind: 'want' as const },
      { id: 'heating', title: 'Отопление', kind: 'need' as const },
    ],
  };

  it('wants needs before wants', () => {
    expect(scorePriority(items, ['food', 'heating', 'poster']).isCorrect).toBe(
      true,
    );
    expect(scorePriority(items, ['food', 'poster', 'heating']).isCorrect).toBe(
      false,
    );
  });
});

describe('scoreDialog', () => {
  it('always completes', () => {
    expect(scoreDialog()).toEqual({ isCorrect: true, rewardShare: 1 });
  });
});
