import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Guards against the same color recipe being written out under several token names (as happened with
 * the TextField, Checkbox and Radio fills). A custom property whose value is a computed recipe,
 * i.e. anything beyond a keyword or a lone var(), may be defined once; other tokens alias it with
 * var(--shared-token). Plain aliases and keywords are fine to repeat: they are how components stay
 * customisable on their own.
 */
function findDuplicateRecipes(css: string): Map<string, string[]> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const byValue = new Map<string, string[]>();
  for (const [, name = '', raw = ''] of withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const value = raw.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();
    const isRecipe = /\w\(/.test(value) && !/^var\([^()]*\)$/.test(value);
    if (!isRecipe) continue;
    byValue.set(value, [...(byValue.get(value) ?? []), name]);
  }
  return new Map([...byValue].filter(([, names]) => names.length > 1));
}

describe('findDuplicateRecipes', () => {
  it('flags the same recipe under two names, ignoring whitespace', () => {
    const css = `:root {
      --a: color-mix(in oklab, var(--p) 15%, transparent);
      --b: color-mix(
        in oklab,
        var(--p) 15%,
        transparent
      );
    }`;
    expect([...findDuplicateRecipes(css).values()]).toEqual([['--a', '--b']]);
  });

  it('allows repeated keywords and bare aliases', () => {
    const css = `:root { --a: transparent; --b: transparent; --c: var(--p); --d: var(--p); }`;
    expect(findDuplicateRecipes(css).size).toBe(0);
  });
});

describe('theme/tokens.css', () => {
  it('defines each color recipe once; other tokens alias it', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/theme/tokens.css'), 'utf8');
    const duplicates = Object.fromEntries(findDuplicateRecipes(css));
    expect(duplicates).toEqual({});
  });
});
