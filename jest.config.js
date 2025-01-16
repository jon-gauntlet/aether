// <!-- LLM:claude CRITICAL: JavaScript test configuration -->
// <!-- LLM:magnetic CORE_JS_TESTS -->

module.exports = {
  // Test discovery
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js', '**/*.test.jsx'],
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Test environment
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.jsx',
    '!src/test/**',
  ],
  coverageDirectory: 'coverage',
  
  // Performance
  maxWorkers: '50%', // Use half of CPU cores
  maxConcurrency: 5,  // Max concurrent tests
  
  // Mocking
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transforms
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// <!-- LLM:verify JavaScript tests MUST use this configuration - NO TypeScript -->
// <!-- LLM:link sled/.claude_marker -->
// <!-- LLM:link sled/scripts/test-runner.sh --> 