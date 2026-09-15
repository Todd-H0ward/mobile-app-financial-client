import { Children, type ReactNode } from 'react';

/**
 * Whether every child is bare text, so the caller must wrap it in a `<Text>`.
 *
 * `typeof children === 'string'` is not enough: JSX interpolation produces an
 * **array** — `<Button>Размер {size}</Button>` hands over `['Размер ', 'L']` —
 * and a raw string reaching a `<View>` crashes React Native with "Text strings
 * must be rendered within a <Text> component".
 *
 * Children React drops on its own (null, undefined, booleans) do not count, so
 * `{cond && <Icon />}` with a falsy `cond` still reads as text-only.
 */
export const isTextOnly = (children: ReactNode): boolean =>
  Children.toArray(children).every(
    (child) => typeof child === 'string' || typeof child === 'number',
  );
