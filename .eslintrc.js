module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // Error Prevention
    'no-console': ['warn', { allow: ['error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-magic-numbers': ['warn', { ignore: [-1, 0, 1] }],
    
    // React Best Practices
    'react/prop-types': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'error',
    'react/no-unused-prop-types': 'error',
    'react/jsx-no-bind': ['warn', {
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false,
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Code Quality
    'complexity': ['warn', 10],
    'max-depth': ['warn', 3],
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 3],
    'max-nested-callbacks': ['warn', 3],
    
    // Import Rules
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    
    // Debug Prevention
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='console'][callee.property.name!='error']",
        message: 'Unexpected console statement. Use debug utilities instead.'
      },
      {
        selector: "CallExpression[callee.name='setTimeout'][arguments.length<2]",
        message: 'setTimeout must have a timeout value'
      },
      {
        selector: "CallExpression[callee.name='setInterval'][arguments.length<2]",
        message: 'setInterval must have an interval value'
      }
    ],
    
    // Performance
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-unstable-nested-components': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-lines': 'off',
        'max-nested-callbacks': 'off'
      }
    },
    {
      files: ['vite.config.js', 'jest.config.js'],
      rules: {
        'no-magic-numbers': 'off'
      }
    }
  ]
}; 