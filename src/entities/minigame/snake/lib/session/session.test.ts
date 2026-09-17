import { describe, expect, it } from 'vitest';

import {
  CLAIM_APPLES,
  canClaimSnake,
  createSnakeSession,
  GRID_SIZE,
  queueDirection,
  tickSnake,
} from './session';

describe('snake session', () => {
  it('starts with a short snake facing right', () => {
    const session = createSnakeSession(() => 0);
    expect(session.snake.length).toBe(3);
    expect(session.direction).toBe('right');
    expect(session.applesEaten).toBe(0);
    expect(canClaimSnake(session)).toBe(false);
    expect(session.apple.x).toBeGreaterThanOrEqual(0);
    expect(session.apple.x).toBeLessThan(GRID_SIZE);
  });

  it('ignores a reverse turn', () => {
    const session = createSnakeSession(() => 0);
    const next = queueDirection(session, 'left');
    expect(next.pendingDirection).toBe('right');
  });

  it('grows endlessly and unlocks cash-out at the claim threshold', () => {
    let session = createSnakeSession(() => 0);
    for (let i = 0; i < CLAIM_APPLES + 4; i += 1) {
      const head = session.snake[0];
      if (!head) break;
      session = {
        ...session,
        apple: { x: head.x + 1, y: head.y },
        pendingDirection: 'right',
        direction: 'right',
      };
      session = tickSnake(session, () => 0);
    }
    expect(session.applesEaten).toBeGreaterThanOrEqual(CLAIM_APPLES);
    expect(canClaimSnake(session)).toBe(true);
    // Still running — another tick does not freeze the session.
    const later = tickSnake(session, () => 0);
    expect(later.snake.length).toBeGreaterThan(0);
  });
});
