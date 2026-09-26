import { createContext, type ReactNode, useContext } from 'react';

const GlassEnabledContext = createContext(false);

/**
 * Wired in Providers from settings + Reduce Transparency.
 * Shared UI reads this — never imports `@/entities/user`.
 */
export const GlassEnabledProvider = ({
  isEnabled,
  children,
}: {
  isEnabled: boolean;
  children: ReactNode;
}) => (
  <GlassEnabledContext.Provider value={isEnabled}>
    {children}
  </GlassEnabledContext.Provider>
);

/** Whether surfaces should render liquid glass / frosted fallback. */
export const useGlassEnabled = (): boolean => useContext(GlassEnabledContext);
