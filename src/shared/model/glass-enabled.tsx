import { createContext, type ReactNode, useContext } from 'react';

const GlassEnabledContext = createContext(false);

/** Wired in Providers — shared UI must not import `@/entities/user`. */
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

/** Terminal static texture on when preference + transparency allow it. */
export const useGlassEnabled = (): boolean => useContext(GlassEnabledContext);
