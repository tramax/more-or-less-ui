import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const copyCssFiles = () => {
  const srcDir = join(__dirname, 'src', 'theme');
  const destDir = join(__dirname, 'dist', 'theme');
  
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  
  const cssFiles = readdirSync(srcDir).filter(f => f.endsWith('.css'));
  for (const file of cssFiles) {
    copyFileSync(join(srcDir, file), join(destDir, file));
  }
  
  // Copy global styles.css
  copyFileSync(join(__dirname, 'src', 'styles.css'), join(__dirname, 'dist', 'styles.css'));
  
  console.log('CSS files copied to dist/');
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
  onSuccess: async () => {
    copyCssFiles();
  },
});