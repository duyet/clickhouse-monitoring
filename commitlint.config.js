// @ts-check

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce consistent scope usage
    'scope-case': [2, 'always', 'kebab-case'],
    // Allow longer subjects for descriptive commits
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    // Allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system or dependencies
        'ci', // CI/CD changes
        'chore', // Maintenance tasks
        'revert', // Revert previous commit
      ],
    ],
  },
}

module.exports = config
