import { useMemo } from 'react';

import { useWindowDimensions } from 'react-native';

import { createResponsive } from '@/shared/lib';

/**
 * Live version of the responsive helpers: recomputes on rotation, split view,
 * foldables and browser resize. Prefer it over the static `vw`/`scale` imports
 * whenever the layout must follow the window.
 *
 * @example
 * const { select, vw, isTablet } = useResponsive();
 * const columns = select({ phone: 1, tablet: 2, desktop: 3 });
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => createResponsive(width, height), [width, height]);
};

/** Just the current breakpoint, for cheap conditional rendering. */
export const useBreakpoint = () => useResponsive().breakpoint;
