import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})
const eslintConfig = [
  ...compat.config({
    extends: [
      'eslint:recommended',
      'plugin:@next/next/recommended',
    ],
    rules: {
      'next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
    },
    settings: {
      tailwindcss: {
        callees: ['cn', 'cva', 'clsx'],
        config: 'tailwind.config.js',
      },
      next: {
        rootDir: ['app/*/'],
      },
    },
  }),
]
export default eslintConfig
