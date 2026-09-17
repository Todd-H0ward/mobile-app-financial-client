import { describe, expect, it } from 'vitest';

import {
  createSpacewarSession,
  fireBullet,
  tickSpacewar,
  WIN_HITS,
} from './session';

describe('spacewar session', () => {
  it('starts with a centred ship and two targets', () => {
    const session = createSpacewarSession();
    expect(session.shipX).toBe(0.5);
    expect(session.targets).toHaveLength(2);
    expect(session.hits).toBe(0);
    expect(session.isWon).toBe(false);
  });

  it('fires a bullet from the ship', () => {
    const session = fireBullet(createSpacewarSession());
    expect(session.bullets).toHaveLength(1);
    expect(session.bullets[0]?.position.x).toBe(0.5);
  });

  it('wins after enough hits', () => {
    let session = createSpacewarSession();
    // Align ship under first target and shoot until WIN_HITS.
    for (let i = 0; i < 40 && !session.isWon; i += 1) {
      const target = session.targets[0];
      if (target) {
        session = { ...session, shipX: target.position.x };
      }
      session = fireBullet(session);
      for (let step = 0; step < 40 && !session.isWon; step += 1) {
        session = tickSpacewar(session, 0.05);
      }
    }
    expect(session.hits).toBeGreaterThanOrEqual(WIN_HITS);
    expect(session.isWon).toBe(true);
  });
});
