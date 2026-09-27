import { useDismissFeedback, useFeedbackReport } from '../model';

import { FeedbackSheet } from './feedback-sheet';

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

/** Mount once next to `<Toaster />`. */
export const FeedbackHost = () => {
  const report = useFeedbackReport();
  const dismiss = useDismissFeedback();

  return (
    <FeedbackSheet
      report={report}
      isVisible={report != null}
      onClose={dismiss}
    />
  );
};
