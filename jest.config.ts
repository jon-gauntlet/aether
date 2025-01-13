import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',                // Enable TypeScript support
  testEnvironment: 'node',          // Node.js test environment
  moduleFileExtensions: [           // Support all relevant extensions
    'ts', 'tsx', 'js', 'jsx', 'json'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',      // Transform TypeScript files
  },
  testMatch: [                      // Find all test files
    '**/__tests__/**/*.[jt]s?(x)', 
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',    // Link to TypeScript config
    },
  },
};

export default config; 