import { createContext, useContext, type MouseEvent } from 'react';

/**
 * What a LinkProvider hands every link: how to go to a place in the app without loading the page.
 * The `href` a link is written with is in the router's own terms (`/about`, relative to its base
 * path), which is not always the URL the browser needs.
 */
export interface LinkRouter {
  /**
   * Goes to `href` in the router (`useNavigate()` in React Router, `router.push` in Next), called
   * for a plain left click on a link to a place in the app. It gets the `href` as written on the
   * link, never the one `resolveHref` makes.
   */
  navigate: (href: string) => void;
  /**
   * Turns the `href` a link is written with into the real URL for the anchor's `href` attribute. Needed
   * only when the two differ, which is when the router adds something the browser has to see:
   *
   * - **A base path.** The app is served under `/app` and the router has `basename: '/app'`. A link
   *   written `href="/about"` is `/about` to the router, but the browser needs `/app/about`.
   *   `resolveHref={(href) => '/app' + href}`.
   * - **A hash router.** The real URL is `https://site/#/about`. `resolveHref={(href) => '#' + href}`.
   *
   * Why it matters: a normal click goes to `navigate` and never uses the attribute. Everything else
   * does: Ctrl / Cmd-click and "open in new tab" (an `/about` would be a 404 under `/app`), "copy link
   * address", the status bar, a crawler, and the page before React has run. Leave it out when the
   * app is served from `/` with a browser router, which is most apps.
   *
   * A plain function, not a hook (React Aria's `useHref` is one), so it can't call a router hook:
   * pass the base path to it yourself.
   */
  resolveHref?: (href: string) => string;
}

/** Null without a LinkProvider: every link is then a plain anchor and the browser loads the page. */
export const LinkRouterContext = createContext<LinkRouter | null>(null);

type LinkInput = {
  href?: string;
  target?: string;
  download?: unknown;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/** A link to another site, a mail address, a phone number: anything the router doesn't own. */
function isOutsideApp(href: string): boolean {
  // A fragment is a place on this page, and the browser scrolls to it
  if (href.startsWith('#')) return true;
  try {
    return new URL(href, window.location.href).origin !== window.location.origin;
  } catch {
    return true;
  }
}

const isPlainPrimaryClick = (event: MouseEvent) =>
  event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/**
 * The `href` and `onClick` an `<a>` should carry. With a LinkProvider, a plain left click on a link
 * to a place in the app goes to the router's `navigate` and the page isn't reloaded; every other click
 * is the browser's: a new tab, a download, another site, a modified click (Ctrl, Cmd, Shift, Alt), a
 * `target` other than `_self`, and a click the caller's own `onClick` already handled
 * (`preventDefault`). Without a provider this changes nothing.
 */
export function useLinkProps({ href, target, download, onClick }: LinkInput) {
  const router = useContext(LinkRouterContext);
  if (!router || href === undefined) return { href, onClick };

  const isOutside = isOutsideApp(href);
  return {
    // `resolveHref` is for the router's own places; another site's URL or a fragment is already real
    href: router.resolveHref && !isOutside ? router.resolveHref(href) : href,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || !isPlainPrimaryClick(event)) return;
      if ((target && target !== '_self') || download !== undefined) return;
      if (isOutside) return;
      event.preventDefault();
      router.navigate(href);
    },
  };
}
