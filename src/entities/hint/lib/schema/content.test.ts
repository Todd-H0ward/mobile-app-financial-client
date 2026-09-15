import { describe, expect, it } from 'vitest';

import { assertHintsContent, getHint, HINT_SCREENS, listHints } from '../..';

import HINTS_CONTENT from '@/content/hints.json';

// ═══════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════

const withHints = (hints: unknown[]) => ({ hints });

// ═══════════════════════════════════════════
// 1. Help really is available everywhere — 2.5.1
// ═══════════════════════════════════════════

describe('content/hints.json', () => {
  it('passes the schema', () => {
    expect(() => assertHintsContent(HINTS_CONTENT)).not.toThrow();
  });

  it('covers every screen that shows the button', () => {
    for (const screen of HINT_SCREENS) {
      const hint = getHint(screen);

      expect(hint.id).toBe(screen);
      expect(hint.title.length).toBeGreaterThan(0);
      expect(hint.body.length).toBeGreaterThan(0);
    }
  });

  it('says something on every screen, not a placeholder', () => {
    for (const hint of listHints()) {
      expect(hint.body.every((line) => line.trim().length > 0)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════
// 2. Broken content fails here, never on the device
// ═══════════════════════════════════════════

describe('assertHintsContent', () => {
  const hints = HINTS_CONTENT.hints;

  it('rejects a screen left without a hint', () => {
    expect(() =>
      assertHintsContent(withHints(hints.filter((hint) => hint.id !== 'home'))),
    ).toThrow(/home/);
  });

  it('rejects a hint for a screen that does not exist', () => {
    expect(() =>
      assertHintsContent(
        withHints([...hints, { id: 'space', title: 'Космос', body: ['Тут'] }]),
      ),
    ).toThrow(/space/);
  });

  it('rejects an empty body and an empty paragraph', () => {
    expect(() =>
      assertHintsContent(
        withHints(
          hints.map((hint) =>
            hint.id === 'home' ? { ...hint, body: [] } : hint,
          ),
        ),
      ),
    ).toThrow(/body/);
    expect(() =>
      assertHintsContent(
        withHints(
          hints.map((hint) =>
            hint.id === 'home' ? { ...hint, body: ['Норм', ''] } : hint,
          ),
        ),
      ),
    ).toThrow(/body\[1\]/);
  });

  it('rejects a duplicate screen id', () => {
    expect(() => assertHintsContent(withHints([...hints, hints[0]]))).toThrow(
      /duplicate/,
    );
  });

  it('rejects termIds that are not a list of ids', () => {
    expect(() =>
      assertHintsContent(
        withHints(
          hints.map((hint) =>
            hint.id === 'home' ? { ...hint, termIds: 'coins' } : hint,
          ),
        ),
      ),
    ).toThrow(/termIds/);
  });

  it('rejects anything that is not a hints file', () => {
    expect(() => assertHintsContent(null)).toThrow();
    expect(() => assertHintsContent({ hints: 'nope' })).toThrow();
    expect(() => assertHintsContent(withHints([...hints, 7]))).toThrow();
  });
});
