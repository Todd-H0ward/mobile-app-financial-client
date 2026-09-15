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

type LinkPressEvent = Parameters<NonNullable<ExternalLinkProps['onPress']>>[0];

// ═══════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════

export const ExternalLink = ({
  href,
  onPress,
  ...props
}: ExternalLinkProps) => {
  const handleLinkClick = (event: LinkPressEvent) => {
    onPress?.(event);

    if (event.defaultPrevented) return;
    if (process.env.EXPO_OS === 'web') return;

    event.preventDefault();

    void openBrowserAsync(href, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return (
    <Link target="_blank" {...props} href={href} onPress={handleLinkClick} />
  );
};

export type { ExternalLinkProps, LinkPressEvent };
