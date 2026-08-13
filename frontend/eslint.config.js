import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', localStorage: 'readonly', console: 'readonly',
        fetch: 'readonly', FormData: 'readonly', alert: 'readonly', confirm: 'readonly',
        setTimeout: 'readonly', performance: 'readonly', requestAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly'
      }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  }
]
