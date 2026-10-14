// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*'],
  },
  {
    // Screens and components take every color from mobile/theme.
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'No hex colors in screens or components. Use a token from @/theme.',
        },
        {
          selector: 'Literal[value=/^rgba?\\(/]',
          message: 'No rgb/rgba colors in screens or components. Use a token from @/theme.',
        },
      ],
    },
  },
]);
