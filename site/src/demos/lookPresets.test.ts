import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOOKS } from './lookPresets';

// Every variable the library defines: in the light tokens, and the dark theme's own (--color-primary-deep).
// Comments go first: they name variables too, and a name in a comment defines nothing.
const defined = new Set(
  ['tokens.css', 'themes.css'].flatMap((file) => {
    const css = readFileSync(resolve(__dirname, '../../../src/theme', file), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    return [...css.matchAll(/(--[\w-]+)\s*:/g)].flatMap((match) => (match[1] ? [match[1]] : []));
  }),
);

describe('LOOKS', () => {
  // A misspelt variable does nothing and says nothing, so each name a look sets has to be one the library
  // defines (below). Retro claims to set all of them, and this is what keeps the claim true: add a token
  // to tokens.css and this fails until Retro (lookPresets.ts) sets it too.
  it('Retro sets every variable the library defines', () => {
    const retro = LOOKS.find((look) => look.value === 'retro');
    const missing = [...defined].filter((name) => !(name in (retro?.vars ?? {})));
    expect(missing).toEqual([]);
  });

  it('start with the library as it comes', () => {
    expect(LOOKS[0]?.vars).toEqual({});
  });

  it.each(LOOKS.filter((look) => look.value !== 'default'))(
    '$label sets only variables the library defines',
    ({ vars }) => {
      const unknown = Object.keys(vars).filter(
        (name) => name.startsWith('--') && !defined.has(name),
      );
      expect(unknown).toEqual([]);
    },
  );

  it.each(LOOKS.filter((look) => look.value !== 'default'))(
    '$label keeps a shadow at two layers, so a hover transition has pairs to interpolate',
    ({ vars }) => {
      for (const name of ['--elevation-less', '--elevation-normal', '--elevation-more']) {
        // Top-level commas only: a color-mix() has commas of its own
        let depth = 0;
        let layerCount = 1;
        for (const char of vars[name] ?? '') {
          if (char === '(') depth++;
          else if (char === ')') depth--;
          else if (char === ',' && depth === 0) layerCount++;
        }
        expect({ name, layerCount }).toEqual({ name, layerCount: 2 });
      }
    },
  );

  it('have unique keys, and each sets well over thirty variables', () => {
    expect(new Set(LOOKS.map((look) => look.value)).size).toBe(LOOKS.length);
    for (const look of LOOKS.slice(1)) expect(Object.keys(look.vars).length).toBeGreaterThan(30);
  });

  it.each(LOOKS.filter((look) => look.fonts))(
    '$label loads its typefaces from Google Fonts and puts each one in a font stack',
    ({ fonts = '', vars }) => {
      expect(fonts.startsWith('https://fonts.googleapis.com/css2?')).toBe(true);
      const families = [...fonts.matchAll(/family=([^:&]+)/g)].map((m) =>
        (m[1] ?? '').replace(/\+/g, ' '),
      );
      expect(families.length).toBeGreaterThan(0);
      const stacks = `${vars['--font-family-body']} ${vars['--font-family-title']}`;
      for (const family of families) expect(stacks).toContain(family);
    },
  );
});
