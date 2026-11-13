const rules = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
};
const plugins = { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') };
const languageOptions = (project) => ({
  ecmaVersion: 'latest',
  sourceType: 'module',
  parser: require('@typescript-eslint/parser'),
  parserOptions: { project, tsconfigRootDir: __dirname },
});

module.exports = [
  {
    ignores: ['dist', 'site/dist', 'node_modules', '*.config.*', '**/*.css'],
  },
  {
    // The library: src/ and .storybook/ are in the root tsconfig
    files: ['**/*.{ts,tsx}'],
    ignores: ['site/**'],
    languageOptions: languageOptions(['./tsconfig.json']),
    plugins,
    rules,
  },
  {
    // The demo site is its own package with its own tsconfig
    files: ['site/**/*.{ts,tsx}'],
    languageOptions: languageOptions(['./site/tsconfig.json']),
    plugins,
    rules,
  },
];
