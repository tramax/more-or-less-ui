import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import * as components from './components';
import * as root from './index';

/**
 * The package entry (src/index.ts) lists the components by name rather than re-exporting
 * `./components` wholesale, so a component added to components/index.ts is missing from the package
 * until it is listed here too (Pagination and Toggle were). These tests fail when the two drift apart.
 */

/** The names inside `export type { ... }` blocks of a file, or `export { ... }` ones. */
function exportedNames(file: string, kind: 'type' | 'value'): string[] {
  const source = readFileSync(resolve(process.cwd(), file), 'utf8');
  const pattern = kind === 'type' ? /export type \{([^}]*)\}/g : /export \{([^}]*)\}/g;
  return [...source.matchAll(pattern)].flatMap(([, list = '']) =>
    list
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

describe('package entry', () => {
  it('exports every component, hook and provider that components/index.ts does', () => {
    const missing = Object.keys(components).filter((name) => !(name in root));
    expect(missing).toEqual([]);
  });

  it('exports every type that components/index.ts does', () => {
    const rootTypes = new Set(exportedNames('src/index.ts', 'type'));
    const missing = exportedNames('src/components/index.ts', 'type').filter(
      (name) => !rootTypes.has(name),
    );
    expect(missing).toEqual([]);
  });
});
