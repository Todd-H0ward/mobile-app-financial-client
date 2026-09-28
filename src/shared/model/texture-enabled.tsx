import { createContext, type ReactNode, useContext } from 'react';

const TextureEnabledContext = createContext(false);

/** Wired in Providers — shared UI must not import `@/entities/user`. */
export const TextureEnabledProvider = ({
  isEnabled,
  children,
}: {
  isEnabled: boolean;
  children: ReactNode;
}) => (
  <TextureEnabledContext.Provider value={isEnabled}>
    {children}
  </TextureEnabledContext.Provider>
);

/** Terminal static texture on when preference + transparency allow it. */
export const useTextureEnabled = (): boolean =>
  useContext(TextureEnabledContext);
