import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'build']),

  {
    files: ['src/**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended
    ],

    // Prettier is registered manually (its "recommended" config uses nested
    // extends internally, which defineConfig() does not allow).
    plugins: {
      prettier
    },

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },

    settings: {
      react: { version: 'detect' }
    },

    rules: {
      // ── React ──────────────────────────────────────────────
      'react/prop-types': 'off', // TypeScript handles this
      'react/require-default-props': 'off', // TypeScript handles defaults
      'react/jsx-props-no-spreading': 'off', // Spread is a common legit pattern
      'react/no-array-index-key': 'error', // Index keys can cause subtle bugs
      'react-hooks/refs': 'error', // react-hooks v7 — refs must not be accessed during render
      'react-hooks/set-state-in-effect': 'error', // react-hooks v7 — setState in effects causes cascading renders

      // ── Accessibility (overrides from extends) ─────────────
      'jsx-a11y/label-has-associated-control': 'off', // MUI handles labels
      'jsx-a11y/no-autofocus': 'off', // Internal app uses autofocus

      // ── TypeScript ─────────────────────────────────────────
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none' }],
      'no-shadow': 'off', // Base rule OFF — use TS-aware version
      '@typescript-eslint/no-shadow': 'error', // Shadowing causes silent bugs
      '@typescript-eslint/no-explicit-any': 'warn', // Surface remaining `any` usage gradually

      // ── Code quality ───────────────────────────────────────
      'no-param-reassign': 'off', // Formik, reducers legitimately reassign
      'no-console': 'error', // No stale console.logs in production

      // ── Imports ────────────────────────────────────────────
      'no-restricted-imports': ['error', { patterns: ['@mui/*/*/*', '!@mui/material/test-utils/*'] }],

      // ── Formatting ─────────────────────────────────────────
      'prettier/prettier': 'warn'
    }
  }
]);
