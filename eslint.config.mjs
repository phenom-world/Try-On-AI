import { FlatCompat } from '@eslint/eslintrc'
import tseslint from '@typescript-eslint/eslint-plugin'
import tseslintParser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/node_modules/*',
      '**/node_modules/**/*',
    ],
  },
  {
    languageOptions: {
      parser: tseslintParser,
    },
  },
  {
    plugins: {
      '@typescript-eslint': tseslint,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        1,
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      'no-use-before-define': ['warn', { variables: true }],
      'no-duplicate-imports': 2,
      'simple-import-sort/imports': 2,
      'simple-import-sort/exports': 2,
      '@typescript-eslint/indent': 0,
      '@typescript-eslint/no-explicit-any': 2,
      'unused-imports/no-unused-imports': 2,
      '@typescript-eslint/no-empty-interface': [
        'error',
        { allowSingleExtends: true },
      ],
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default eslintConfig
