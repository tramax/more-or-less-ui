import { useEffect } from 'react';
import { setCSSVariable } from 'more-or-less-ui';

/**
 * Sets CSS variables on the page (`:root`), where every derived color is computed and where the library's
 * overlays (a dialog, a menu, a toast) inherit from. They go back to the stylesheet's values when `vars`
 * changes and when the page is left. A `null` value leaves that variable to the stylesheet.
 */
export function useRootVariables(vars: Record<string, string | null>) {
  // The object is new on every render; its content is what matters
  const key = JSON.stringify(vars);

  useEffect(() => {
    const applied = Object.entries(JSON.parse(key) as Record<string, string | null>).filter(
      (entry): entry is [string, string] => entry[1] !== null,
    );
    for (const [name, value] of applied) setCSSVariable(name, value);
    return () => {
      for (const [name] of applied) document.documentElement.style.removeProperty(name);
    };
  }, [key]);
}
