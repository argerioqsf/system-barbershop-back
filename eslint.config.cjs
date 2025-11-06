const config = require('@rocketseat/eslint-config/node')

module.exports = {
  ...config,
  ignores: [...(config.ignores ?? []), 'node_modules/**', 'build/**'],
  overrides: [
    ...(config.overrides ?? []),
    {
      files: ['src/core/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/modules/**', '**/modules/**'],
                message:
                  'Core não pode importar de modules. Extraia lógica compartilhada para o core ou exponha portas.',
              },
            ],
          },
        ],
      },
    },
  ],
}
