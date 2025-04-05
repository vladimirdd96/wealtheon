module.exports = {
  plugins: {
    'postcss-import': {},
    '@tailwindcss/postcss7-compat': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true,
      },
    },
  },
} 