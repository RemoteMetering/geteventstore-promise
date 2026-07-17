import js from '@eslint/js';
import pluginN from 'eslint-plugin-n';
import pluginJson from '@eslint/json';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/doc/**',
      '**/public/**',
      '**/coverage/**',
      '**/.claude/**',
      'eslint.config.mjs'
    ]
  },
  {
    ...js.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs']
  },
  {
    ...pluginN.configs['flat/recommended'],
    files: ['**/*.js', '**/*.mjs', '**/*.cjs']
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    plugins: {
      prettier: pluginPrettier
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      'prettier/prettier': 'error',
      // Disallow variable declarations that shadow an outer scope.
      'no-shadow': 'error',
      // Require file extensions on relative imports (ESM needs them at runtime).
      'n/file-extension-in-import': ['error', 'always'],
      // Node 20+ supports ESM natively, so do not flag module syntax.
      'n/no-unsupported-features/es-syntax': ['error', { ignores: ['modules', 'dynamicImport'] }],
      // The tcp library relies on private handler state; do not lint control chars in regexes.
      'no-control-regex': 'off',
      // Ban footguns that @eslint/js recommended leaves on the table.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
        },
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
        }
      ]
    }
  },
  {
    // Tests intentionally throw fresh assertion errors from catch blocks,
    // where the caught error is not a meaningful cause.
    files: ['tests/**'],
    rules: {
      'preserve-caught-error': 'off'
    }
  },
  prettierConfig,
  {
    ...pluginJson.configs.recommended,
    files: ['**/*.json'],
    language: 'json/json',
    plugins: {
      ...pluginJson.configs.recommended.plugins,
      prettier: pluginPrettier
    },
    rules: {
      ...pluginJson.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    ...pluginJson.configs.recommended,
    files: ['**/*.jsonc'],
    language: 'json/jsonc',
    plugins: {
      ...pluginJson.configs.recommended.plugins,
      prettier: pluginPrettier
    },
    rules: {
      ...pluginJson.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  }
];
