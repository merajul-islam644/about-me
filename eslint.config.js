import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Core ESLint never counts JSX identifiers as variable usage — without
      // this rule every lowercase JSX component (motion.div, Link, …) reads
      // as "defined but never used".
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    // Build/lint configs run in Node — they need process and friends, which
    // the browser-only globals above correctly deny to app source.
    files: ['eslint.config.js', 'vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
