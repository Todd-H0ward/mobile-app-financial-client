import { Children, type ReactNode } from 'react';

/** True when every child is text/number — JSX arrays still need a `<Text>` wrap. */
export const isTextOnly = (children: ReactNode): boolean =>
  Children.toArray(children).every(
    (child) => typeof child === 'string' || typeof child === 'number',
  );
