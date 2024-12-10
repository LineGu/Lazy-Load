module.exports = {
  extends: ['eslint:recommended'],
  env: {
    node: true,
    commonjs: true,
    browser: true,
    es6: true,
  },
  rules: {
    'no-unused-vars': 'error',
    'no-undef': 'error',
  },
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint/eslint-plugin'],
  ignorePatterns: 'src/test/**',
  globals: { React: true },
};
