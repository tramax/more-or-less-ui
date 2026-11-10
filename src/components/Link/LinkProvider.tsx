'use client';

import { useMemo, type ReactNode } from 'react';
import { LinkRouterContext, type LinkRouter } from '../_shared/useLinkProps';

export type LinkProviderProps = LinkRouter & {
  children: ReactNode;
};

/**
 * Tells every link below it how to move around your app, so a click on a link to a place in it goes
 * to your router instead of loading the page. Put it once, inside your router:
 *
 * ```tsx
 * const navigate = useNavigate();
 * <LinkProvider navigate={navigate}>…</LinkProvider>
 * ```
 *
 * It works with any router, because it takes a function and not a router. Links to other sites,
 * downloads, `target="_blank"` and modified clicks (Ctrl, Cmd, Shift, Alt) are left to the browser.
 * Without it, links are plain anchors.
 *
 * Write every `href` the way your router does (`/about`). If your app lives under a base path
 * (`/app`) or uses a hash router (`#/about`), also pass `resolveHref`, so the link on the page is the
 * real URL and "open in new tab" and "copy link address" work:
 *
 * ```tsx
 * <LinkProvider navigate={navigate} resolveHref={(href) => `/app${href}`}>
 * // <Link href="/about"> renders <a href="/app/about">, and a click calls navigate('/about')
 * ```
 */
export function LinkProvider({ navigate, resolveHref, children }: LinkProviderProps) {
  // Memoised on the two functions, so a parent that renders often doesn't re-render every link
  const router = useMemo(() => ({ navigate, resolveHref }), [navigate, resolveHref]);
  return <LinkRouterContext.Provider value={router}>{children}</LinkRouterContext.Provider>;
}
