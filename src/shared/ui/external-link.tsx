import type { ComponentProps } from 'react';

import { type Href, Link } from 'expo-router';
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface ExternalLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: Href & string;
}

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

/** Opens the link in an in-app browser on native, in a new tab on web. */
export const ExternalLink = ({
  href,
  onPress,
  ...props
}: ExternalLinkProps) => {
  return (
    <Link
      target="_blank"
      {...props}
      href={href}
      onPress={async (event) => {
        // The caller's handler runs first and may cancel the navigation, the
        // same contract a plain `<Link>` gives it.
        onPress?.(event);

        if (event.defaultPrevented) return;

        if (process.env.EXPO_OS !== 'web') {
          event.preventDefault();

          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
};

export type { ExternalLinkProps };
