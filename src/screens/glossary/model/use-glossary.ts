import { listTerms } from '@/entities/glossary';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

export const useGlossary = () => ({
  terms: listTerms(),
});
