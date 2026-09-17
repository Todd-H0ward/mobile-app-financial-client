import { useEffect, useState } from 'react';

import { AccessibilityInfo } from 'react-native';

/** System Reduce Motion — combined with the user switch in `useIsMotionEnabled`. */
export const useReducedMotion = (): boolean => {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setIsReduced(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return isReduced;
};
