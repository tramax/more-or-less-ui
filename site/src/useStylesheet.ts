import { useEffect } from 'react';

/**
 * Loads a stylesheet (a Google Fonts URL) the first time something asks for it, and not before. It stays
 * in the page afterwards: the browser has it cached, and taking it out would only flash the fallback font
 * the next time. `undefined` asks for nothing.
 */
export function useStylesheet(href: string | undefined) {
  useEffect(() => {
    if (!href) return;
    const isLoaded = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some(
      (link) => link.href === href,
    );
    if (isLoaded) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }, [href]);
}
