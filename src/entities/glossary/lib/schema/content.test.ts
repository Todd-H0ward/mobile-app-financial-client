import { describe, expect, it } from 'vitest';

import { assertGlossaryContent, getTermById, listTerms } from '../..';

import GLOSSARY_CONTENT from '@/content/glossary.json';

// ═══════════════════════════════════════════
describe('glossary content', () => {
  it('accepts the shipped file', () => {
    expect(() => assertGlossaryContent(GLOSSARY_CONTENT)).not.toThrow();
  });

  it('lists every term with a stable id', () => {
    const terms = listTerms();
    expect(terms.length).toBeGreaterThanOrEqual(8);
    for (const term of terms) {
      expect(getTermById(term.id)?.id).toBe(term.id);
      expect(term.definition.length).toBeGreaterThan(0);
    }
  });

  it('covers the three budget words', () => {
    expect(getTermById('needs')).toBeDefined();
    expect(getTermById('wants')).toBeDefined();
    expect(getTermById('savings')).toBeDefined();
  });

  it('rejects a duplicate id', () => {
    expect(() =>
      assertGlossaryContent({
        terms: [
          ...GLOSSARY_CONTENT.terms,
          {
            id: GLOSSARY_CONTENT.terms[0]?.id,
            title: 'Дубль',
            definition: 'Не должен пройти.',
          },
        ],
      }),
    ).toThrow(/duplicate/);
  });
});
