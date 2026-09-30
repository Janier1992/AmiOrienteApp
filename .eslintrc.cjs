module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: ['react-app'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  overrides: [
    {
      files: ['src/**/__tests__/**', 'src/**/*.{test,spec}.{js,jsx}'],
      env: { jest: true },
      globals: { vi: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly' },
    },
  ],
  ignorePatterns: ['dist', 'dev-dist', 'node_modules'],
};
