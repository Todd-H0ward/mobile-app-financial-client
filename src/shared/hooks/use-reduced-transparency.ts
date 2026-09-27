import { useEffect, useState } from 'react';

import { AccessibilityInfo } from 'react-native';

/** System Reduce Transparency — a11y wins over the glass preference. */
export const useReducedTransparency = (): boolean => {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    const read = AccessibilityInfo.isReduceTransparencyEnabled;
    if (typeof read !== 'function') return;
    void read().then((enabled) => {
      if (mounted) setIsReduced(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setIsReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return isReduced;
};
