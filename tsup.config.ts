import { defineConfig, type Options } from 'tsup';
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';

const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');

/** Inline the `@import './x.css'` lines of a stylesheet so it has no relative imports. */
const inlineImports = (file: string, baseDir: string): string =>
  readFileSync(file, 'utf8').replace(/@import\s+['"](.+?)['"];?/g, (_, rel: string) =>
    inlineImports(join(baseDir, rel), baseDir),
  );

/**
 * tsup's built-in CSS plugin claims every *.css file and ignores esbuild's `local-css` loader,
 * so *.module.css is routed through its own namespace to reach esbuild's native CSS Modules
 * support: scoped class names, a class map in the JS, and the CSS emitted as dist/index.css.
 */
type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

const cssModules: EsbuildPlugin = {
  name: 'css-modules',
  setup(build) {
    // The suffix keeps the virtual path from ending in ".css": tsup's onLoad filter has no namespace, so it would match anyway.
    const SUFFIX = '?css-module';
    build.onResolve({ filter: /\.module\.css$/ }, (args) => ({
      path: join(args.resolveDir, args.path) + SUFFIX,
      namespace: 'css-module',
    }));
    build.onLoad({ filter: /.*/, namespace: 'css-module' }, (args) => {
      const file = args.path.slice(0, -SUFFIX.length);
      return { contents: readFileSync(file, 'utf8'), loader: 'local-css', resolveDir: dirname(file) };
    });
  },
};

const emitCss = () => {
  // Theme files stay individually importable (more-or-less-ui/theme/tokens.css, ...)
  const themeDest = join(distDir, 'theme');
  mkdirSync(themeDest, { recursive: true });
  for (const file of readdirSync(join(srcDir, 'theme')).filter((f) => f.endsWith('.css'))) {
    copyFileSync(join(srcDir, 'theme', file), join(themeDest, file));
  }

  // dist/styles.css = tokens + base styles + bundled component CSS Modules (esbuild emits the latter as dist/index.css)
  const componentCss = join(distDir, 'index.css');
  let css = inlineImports(join(srcDir, 'styles.css'), srcDir);
  if (existsSync(componentCss)) {
    const componentCode = readFileSync(componentCss, 'utf8').replace(/\/\*# sourceMappingURL=.*?\*\//g, '').trim();
    css += `\n${componentCode}\n`;
    rmSync(componentCss);
    rmSync(`${componentCss}.map`, { force: true });
  }
  writeFileSync(join(distDir, 'styles.css'), css);
  console.log('CSS emitted to dist/styles.css');
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom'],
  esbuildPlugins: [cssModules],
  onSuccess: async () => {
    emitCss();
  },
});
