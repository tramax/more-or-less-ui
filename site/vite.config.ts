import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the project at /<repo>/, so assets need that prefix in the build.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/more-or-less-ui/' : '/',
  plugins: [react()],
}));
