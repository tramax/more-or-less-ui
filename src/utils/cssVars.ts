/**
 * CSS Variable utilities for runtime access to design tokens.
 * Useful for charting libraries, canvas, or dynamic styles.
 */

const ROOT = typeof document !== 'undefined' ? document.documentElement : null;

/**
 * Get the computed value of a CSS variable.
 * @param name - CSS variable name (e.g., '--color-primary-500')
 * @param element - Element to read from (default: document.documentElement)
 * @returns The computed value, or empty string if not found
 */
export function getCSSVariable(name: string, element: HTMLElement = ROOT!): string {
  if (!element) return '';
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/**
 * Get all CSS variables matching a prefix.
 * @param prefix - Prefix to match (e.g., '--color-', '--size-')
 * @param element - Element to read from
 * @returns Object mapping variable names to values
 */
export function getCSSVariablesByPrefix(
  prefix: string,
  element: HTMLElement = ROOT!,
): Record<string, string> {
  if (!element) return {};

  const styles = getComputedStyle(element);
  const result: Record<string, string> = {};

  for (let i = 0; i < styles.length; i++) {
    const name = styles[i];
    if (name && name.startsWith(prefix)) {
      result[name] = styles.getPropertyValue(name).trim();
    }
  }

  return result;
}

/**
 * Get all scale tokens as an object.
 */
export function getScaleTokens(): {
  size: Record<'less' | 'normal' | 'more', string>;
  radius: Record<'less' | 'normal' | 'more', string>;
  weight: Record<'less' | 'normal' | 'more', string>;
  space: Record<'less' | 'normal' | 'more', string>;
  elevation: Record<'less' | 'normal' | 'more', string>;
} {
  return {
    size: {
      less: getCSSVariable('--size-less'),
      normal: getCSSVariable('--size-normal'),
      more: getCSSVariable('--size-more'),
    },
    radius: {
      less: getCSSVariable('--radius-less'),
      normal: getCSSVariable('--radius-normal'),
      more: getCSSVariable('--radius-more'),
    },
    weight: {
      less: getCSSVariable('--weight-less'),
      normal: getCSSVariable('--weight-normal'),
      more: getCSSVariable('--weight-more'),
    },
    space: {
      less: getCSSVariable('--space-less'),
      normal: getCSSVariable('--space-normal'),
      more: getCSSVariable('--space-more'),
    },
    elevation: {
      less: getCSSVariable('--elevation-less'),
      normal: getCSSVariable('--elevation-normal'),
      more: getCSSVariable('--elevation-more'),
    },
  };
}

/**
 * Get all color tokens as an object.
 */
export function getColorTokens(): Record<string, string> {
  return getCSSVariablesByPrefix('--color-');
}

/**
 * Set a CSS variable on the root element (for dynamic theming).
 * Note: Prefer using ThemeProvider or CSS overrides instead.
 */
export function setCSSVariable(name: string, value: string): void {
  if (ROOT) {
    ROOT.style.setProperty(name, value);
  }
}
