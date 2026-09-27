import { createContext, type ReactNode, useContext } from 'react';

const GlassEnabledContext = createContext(false);

/**
 * Legacy saved preference now controls the static terminal texture.
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

/** Whether terminal screens should render their subtle static texture. */
export const useGlassEnabled = (): boolean => useContext(GlassEnabledContext);
