import { createContext, type ReactNode, useContext } from 'react';

const MotionEnabledContext = createContext(true);

/** Wired in Providers from settings + Reduce Motion; shared UI reads this. */
export const MotionEnabledProvider = ({
  isEnabled,
  children,
}: {
  isEnabled: boolean;
  children: ReactNode;
}) => (
  <MotionEnabledContext.Provider value={isEnabled}>
    {children}
  </MotionEnabledContext.Provider>
);

export const useMotionEnabled = (): boolean => useContext(MotionEnabledContext);
