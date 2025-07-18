const config = require('@rocketseat/eslint-config/node')

module.exports = {
  ...config,
  ignores: ['node_modules/**', 'build/**'],
}
