import { listTerms } from '@/entities/glossary';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/** Glossary catalogue for the terms screen — content only, no save. */
export const useGlossary = () => ({
  terms: listTerms(),
});
