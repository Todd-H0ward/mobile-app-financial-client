import type { GlossaryTerm } from '../../model';
import { assertGlossaryContent } from '../schema';

import GLOSSARY_CONTENT from '@/content/glossary.json';

// ═══════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════

/** Validated once at module load — bad JSON fails in tests, not mid-session. */
const TERMS = assertGlossaryContent(GLOSSARY_CONTENT).terms;

export const listTerms = (): readonly GlossaryTerm[] => TERMS;

export const getTermById = (id: string): GlossaryTerm | undefined =>
  TERMS.find((term) => term.id === id);
