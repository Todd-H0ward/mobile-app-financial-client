// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

type Direction = 'up' | 'down' | 'left' | 'right';

interface Cell {
  /** Column index, 0…GRID_SIZE-1. */
  x: number;
  /** Row index, 0…GRID_SIZE-1. */
  y: number;
}

interface SnakeSession {
  /** Head-first body cells. */
  snake: readonly Cell[];
  /** Current travel direction. */
  direction: Direction;
  /** Queued turn applied on the next tick (never a reverse). */
  pendingDirection: Direction;
  /** Apple the head must reach. */
  apple: Cell;
  /**
   * Apples eaten this sitting. Endless — never auto-ends.
   * Cash-out unlocks at {@link CLAIM_APPLES}.
   */
  applesEaten: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Square grid width/height in cells. */
export const GRID_SIZE = 12;

/**
 * Minimum apples before the child may cash out. Play stays endless;
 * the sitting pays when they choose to claim.
 */
export const CLAIM_APPLES = 3;

/** Milliseconds between ticks — fixed, no countdown UI. */
export const TICK_MS = 220;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const cellKey = (cell: Cell): string => `${cell.x},${cell.y}`;

const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

const randomEmptyCell = (
  occupied: readonly Cell[],
  rng: () => number,
): Cell => {
  const blocked = new Set(occupied.map(cellKey));
  const free: Cell[] = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!blocked.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  const index = Math.floor(rng() * free.length);
  return free[index] ?? { x: 0, y: 0 };
};

const stepCell = (cell: Cell, direction: Direction): Cell => {
  switch (direction) {
    case 'up':
      return { x: cell.x, y: cell.y - 1 };
    case 'down':
      return { x: cell.x, y: cell.y + 1 };
    case 'left':
      return { x: cell.x - 1, y: cell.y };
    case 'right':
      return { x: cell.x + 1, y: cell.y };
  }
};

const isInBounds = (cell: Cell): boolean =>
  cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE;

/** Whether the cash-out button may appear for this score. */
export const canClaimSnake = (session: SnakeSession): boolean =>
  session.applesEaten >= CLAIM_APPLES;

/**
 * Fresh sitting: short snake mid-board, facing right, one apple elsewhere.
 */
export const createSnakeSession = (
  rng: () => number = Math.random,
): SnakeSession => {
  const mid = Math.floor(GRID_SIZE / 2);
  const snake: Cell[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    snake,
    direction: 'right',
    pendingDirection: 'right',
    apple: randomEmptyCell(snake, rng),
    applesEaten: 0,
  };
};

/**
 * Queue a turn. Reverse is ignored so a fast swipe cannot fold the snake.
 */
export const queueDirection = (
  session: SnakeSession,
  next: Direction,
): SnakeSession => {
  if (OPPOSITE[session.direction] === next) return session;
  return { ...session, pendingDirection: next };
};

/**
 * Advance one tick. Wall / self hit restarts the body but keeps the score —
 * endless play, never a failed sitting.
 */
export const tickSnake = (
  session: SnakeSession,
  rng: () => number = Math.random,
): SnakeSession => {
  const direction = session.pendingDirection;
  const head = session.snake[0];
  if (!head) return session;

  const nextHead = stepCell(head, direction);
  const hitWall = !isInBounds(nextHead);
  const hitSelf = session.snake.some((cell) => sameCell(cell, nextHead));

  if (hitWall || hitSelf) {
    const restarted = createSnakeSession(rng);
    return {
      ...restarted,
      applesEaten: session.applesEaten,
    };
  }

  const ate = sameCell(nextHead, session.apple);
  const body = ate
    ? [nextHead, ...session.snake]
    : [nextHead, ...session.snake.slice(0, -1)];
  const applesEaten = ate ? session.applesEaten + 1 : session.applesEaten;

  return {
    snake: body,
    direction,
    pendingDirection: direction,
    apple: ate ? randomEmptyCell(body, rng) : session.apple,
    applesEaten,
  };
};

export type { Cell, Direction, SnakeSession };
