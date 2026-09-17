import { isNonEmptyString, isRecord } from '@/shared/utils';

import type { GlossaryFile, GlossaryTerm } from '../../model';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/** Enough terms to cover the three budget words and the key mechanics. */
const MIN_TERMS = 8;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

const assertTerm = (term: unknown, path: string): GlossaryTerm => {
  if (!isRecord(term)) {
    throw new Error(`${path}: must be an object`);
  }
  if (!isNonEmptyString(term.id)) {
    throw new Error(`${path}.id: non-empty string required`);
  }
  if (!isNonEmptyString(term.title)) {
    throw new Error(`${path}.title: non-empty string required`);
  }
  if (!isNonEmptyString(term.definition)) {
    throw new Error(`${path}.definition: non-empty string required`);
  }

  return term as unknown as GlossaryTerm;
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Validates `content/glossary.json`.
 *
 * Terms are the grown-up's and child's shared vocabulary (2.5.11) — a broken
 * row must fail in tests, not open an empty sheet on the device.
 */
export const assertGlossaryContent = (data: unknown): GlossaryFile => {
  if (!isRecord(data)) {
    throw new Error('glossary content: must be an object');
  }
  if (!Array.isArray(data.terms)) {
    throw new Error('glossary content: "terms" must be an array');
  }
  if (data.terms.length < MIN_TERMS) {
    throw new Error(
      `glossary content: need at least ${MIN_TERMS} terms — 2.5.11`,
    );
  }

  const ids = new Set<string>();
  const terms = data.terms.map((term, index) => {
    const parsed = assertTerm(term, `terms[${index}]`);
    if (ids.has(parsed.id)) {
      throw new Error(`glossary: duplicate id "${parsed.id}"`);
    }
    ids.add(parsed.id);
    return parsed;
  });

  return { terms };
};
