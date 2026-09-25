import { useState } from 'react';

import type { WatcherPageId } from '@/entities/watcher';

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

/**
 * Page stack inside one watcher session.
 *
 * Opening a watcher always starts on greeting; leave clears via the parent.
 */
export const useWatcherSession = (initialPage: WatcherPageId = 'greeting') => {
  const [page, setPage] = useState<WatcherPageId>(initialPage);

  return {
    page,
    open: (next: WatcherPageId) => setPage(next),
    backToGreeting: () => setPage('greeting'),
    reset: (next: WatcherPageId = 'greeting') => setPage(next),
  };
};
