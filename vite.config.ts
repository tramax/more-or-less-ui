import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Shared by Storybook (react-vite) and Vitest. The library itself is built by tsup, not Vite.
// `tsconfigPaths` makes the `@/*` alias from tsconfig.json work here too.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
  },
});
