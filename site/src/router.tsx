import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LinkProvider } from 'more-or-less-ui';
import { STORYBOOK_URL } from './links';

export type Route =
  | { page: 'home' }
  | { page: 'principles'; slug?: string }
  | { page: 'about' }
  | { page: 'not-found' };

/** `/principles/affordance` -> the principles page, scrolled to that card. */
export function parseRoute(path: string): Route {
  const [first, slug] = path.split('/').filter(Boolean);
  switch (first) {
    case undefined:
      return { page: 'home' };
    case 'principles':
      return { page: 'principles', slug };
    case 'about':
      return { page: 'about' };
    default:
      return { page: 'not-found' };
  }
}

/** The element id of a card on a page, for a route's `slug` to scroll to. */
export const anchorId = (page: 'principles', slug: string) => `${page}-${slug}`;

const readPath = () => {
  const hash = window.location.hash.slice(1);
  return hash.startsWith('/') ? hash : '/';
};

type RouterValue = { route: Route; navigate: (to: string) => void };
const RouterContext = createContext<RouterValue | null>(null);

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used within a Router');
  return value;
}

/**
 * A hash router (`#/principles`): the site is static and hosted on GitHub Pages, which has no server
 * to answer `/principles`. It hands the library's own `LinkProvider` its `navigate`, so every `Link`
 * on the site goes through it.
 */
export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onHashChange = () => setPath(readPath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);
  // Storybook is a page beside the site, not a route in it
  const resolveHref = useCallback(
    (href: string) => (href.startsWith(STORYBOOK_URL) ? href : `#${href}`),
    [],
  );

  const route = useMemo(() => parseRoute(path), [path]);

  // A new route starts at the top, or at the card its slug names
  useEffect(() => {
    const target =
      route.page === 'principles' && route.slug
        ? document.getElementById(anchorId(route.page, route.slug))
        : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [route]);

  const value = useMemo(() => ({ route, navigate }), [route, navigate]);

  return (
    <RouterContext.Provider value={value}>
      <LinkProvider navigate={navigate} resolveHref={resolveHref}>
        {children}
      </LinkProvider>
    </RouterContext.Provider>
  );
}
