import { isNonEmptyString, isRecord } from '@/shared/utils';

import {
  HINT_SCREENS,
  type HintContent,
  type HintScreenId,
  type HintsFile,
} from '../../model';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const assertHint = (hint: unknown, path: string): HintContent => {
  if (!isRecord(hint)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!HINT_SCREENS.includes(hint.id as HintScreenId)) {
    throw new Error(`${path}.id: unknown screen "${String(hint.id)}"`);
  }
  if (!isNonEmptyString(hint.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!Array.isArray(hint.body) || hint.body.length === 0) {
    throw new Error(`${path}.body: at least one paragraph required`);
  }
  for (const [index, paragraph] of hint.body.entries()) {
    if (!isNonEmptyString(paragraph)) {
      throw new Error(`${path}.body[${index}]: non-empty string required`);
    }
  }
  if (hint.termIds !== undefined) {
    if (!Array.isArray(hint.termIds)) {
      throw new Error(`${path}.termIds: must be an array when present`);
    }
    for (const [index, term] of hint.termIds.entries()) {
      if (!isNonEmptyString(term)) {
        throw new Error(`${path}.termIds[${index}]: non-empty string required`);
      }
    }
  }

  return hint as unknown as HintContent;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/hints.json` (or a fixture shaped like it).
 *
 * "Available at any moment" is only true if every screen has something to say,
 * so a missing screen is an error here rather than a "?" that opens an empty
 * sheet on the device — 2.5.1.
 */
export const assertHintsContent = (data: unknown): HintsFile => {
  if (!isRecord(data)) {
    throw new Error('hints content: must be an object');
  }
  if (!Array.isArray(data.hints)) {
    throw new Error('hints content: "hints" must be an array');
  }

  const hints = data.hints.map((hint, index) =>
    assertHint(hint, `hints[${index}]`),
  );

  const ids = new Set(hints.map((hint) => hint.id));
  if (ids.size !== hints.length) {
    throw new Error('hints content: duplicate screen id');
  }
  for (const screen of HINT_SCREENS) {
    if (!ids.has(screen)) {
      throw new Error(`hints content: screen "${screen}" has no hint — 2.5.1`);
    }
  }

  return { hints };
};
