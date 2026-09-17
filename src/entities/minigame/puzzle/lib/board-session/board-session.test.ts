import { describe, expect, it } from 'vitest';

import type { DragGhost, ScreenRect } from '../../model/types';

import {
  applyDrop,
  buildPieces,
  dropTargetOf,
  isBoardComplete,
  loosePlacementOf,
  placedCountOf,
  restorePlacements,
  revealEdges,
  revealPiece,
  SNAP_THRESHOLD_RATIO,
  slotRectOf,
  trayOrderOf,
  trayPiecesOf,
  visibleBoardRect,
} from './board-session';

const rect = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): ScreenRect => ({ left, top, right, bottom });

const ghostAt = (
  id: number,
  left: number,
  top: number,
  size = 40,
): DragGhost => ({
  id,
  left,
  top,
  size,
});

describe('restorePlacements', () => {
  it('keeps only in-range ids', () => {
    expect(
      restorePlacements(
        {
          0: { kind: 'placed' },
          2: { kind: 'tray' },
          9: { kind: 'placed' },
          [-1]: { kind: 'tray' },
        },
        3,
      ),
    ).toEqual({
      0: { kind: 'placed' },
      2: { kind: 'tray' },
    });
  });
});

describe('buildPieces / tray', () => {
  it('defaults missing placements to the tray', () => {
    const pieces = buildPieces(4, 2, 7, { 1: { kind: 'placed' } });
    expect(pieces).toHaveLength(4);
    expect(pieces[0]?.placement).toEqual({ kind: 'tray' });
    expect(pieces[1]?.placement).toEqual({ kind: 'placed' });
    expect(pieces[0]?.targetRow).toBe(0);
    expect(pieces[3]?.targetCol).toBe(1);
  });

  it('orders tray pieces by shuffle nonce', () => {
    const pieces = buildPieces(4, 2, 11, {});
    const order = trayOrderOf(4, 11, 0);
    const tray = trayPiecesOf(pieces, order);
    expect(tray.map((p) => p.id)).toEqual(order);
  });
});

describe('visibleBoardRect', () => {
  it('intersects board with viewport', () => {
    expect(
      visibleBoardRect(rect(0, 0, 100, 100), rect(20, 30, 80, 90)),
    ).toEqual(rect(20, 30, 80, 90));
  });
});

describe('slotRectOf', () => {
  it('splits the board into the expected cell for an id', () => {
    expect(slotRectOf(rect(0, 0, 200, 200), 2, 2, 3)).toEqual(
      rect(100, 100, 200, 200),
    );
    expect(slotRectOf(rect(10, 20, 210, 220), 2, 2, 0)).toEqual(
      rect(10, 20, 110, 120),
    );
  });
});

describe('dropTargetOf', () => {
  const board = rect(0, 0, 300, 300);
  const slot = rect(0, 0, 100, 100);

  it('returns tray when the centre is outside the panel', () => {
    expect(
      dropTargetOf({
        board,
        viewport: board,
        slot,
        ghost: ghostAt(0, 400, 400),
      }),
    ).toBe('tray');
  });

  it('returns board when over the table but far from the slot', () => {
    expect(
      dropTargetOf({
        board,
        viewport: board,
        slot,
        ghost: ghostAt(0, 200, 200),
      }),
    ).toBe('board');
  });

  it('returns slot when the centre is within the snap radius', () => {
    const size = 40;
    // Centre at slot centre (50, 50)
    const ghost = ghostAt(0, 50 - size / 2, 50 - size / 2, size);
    expect(
      dropTargetOf({
        board,
        viewport: board,
        slot,
        ghost,
        snapRatio: SNAP_THRESHOLD_RATIO,
      }),
    ).toBe('slot');
  });

  it('returns board when the slot is missing', () => {
    expect(
      dropTargetOf({
        board,
        viewport: board,
        slot: null,
        ghost: ghostAt(0, 20, 20),
      }),
    ).toBe('board');
  });
});

describe('applyDrop / loosePlacementOf', () => {
  it('places, parks loose, or returns to tray', () => {
    expect(
      applyDrop({
        placements: {},
        id: 1,
        target: 'slot',
      })[1],
    ).toEqual({ kind: 'placed' });

    expect(
      applyDrop({
        placements: { 1: { kind: 'placed' } },
        id: 1,
        target: 'tray',
      })[1],
    ).toEqual({ kind: 'tray' });

    expect(
      applyDrop({
        placements: {},
        id: 2,
        target: 'board',
        loose: { kind: 'loose', x: 0.2, y: 0.3 },
      })[2],
    ).toEqual({ kind: 'loose', x: 0.2, y: 0.3 });
  });

  it('clamps loose coords to the board', () => {
    const board = rect(0, 0, 200, 200);
    const loose = loosePlacementOf({
      ghost: ghostAt(0, 50, 50, 40),
      board,
      viewport: board,
      cols: 4,
      rows: 4,
    });
    expect(loose.kind).toBe('loose');
    expect(loose.x).toBeGreaterThanOrEqual(0);
    expect(loose.y).toBeGreaterThanOrEqual(0);
    expect(loose.x).toBeLessThanOrEqual(1 - 1 / 4);
    expect(loose.y).toBeLessThanOrEqual(1 - 1 / 4);
  });
});

describe('reveal hints', () => {
  it('revealPiece places the first free id in tray order', () => {
    const result = revealPiece({ 0: { kind: 'placed' } }, [0, 2, 1]);
    expect(result?.id).toBe(2);
    expect(result?.placements[2]).toEqual({ kind: 'placed' });
  });

  it('revealEdges places every free edge piece', () => {
    const pieces = buildPieces(9, 3, 1, {});
    const result = revealEdges(pieces, 3, 3, {});
    expect(result).not.toBeNull();
    expect(result?.ids.length).toBeGreaterThan(0);
    for (const id of result?.ids ?? []) {
      expect(result?.placements[id]).toEqual({ kind: 'placed' });
    }
  });
});

describe('completion', () => {
  it('counts placed pieces and detects a full board', () => {
    const pieces = buildPieces(4, 2, 3, {
      0: { kind: 'placed' },
      1: { kind: 'placed' },
      2: { kind: 'placed' },
      3: { kind: 'placed' },
    });
    expect(placedCountOf(pieces)).toBe(4);
    expect(isBoardComplete(4, 4)).toBe(true);
    expect(isBoardComplete(3, 4)).toBe(false);
  });
});
