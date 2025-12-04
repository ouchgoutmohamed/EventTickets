module.exports = {
  // Environment de test
  testEnvironment: 'node',

  // Patterns pour trouver les fichiers de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Couverture de code
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/generated/**',
    '!**/node_modules/**',
  ],

  // Seuils de couverture (ajustés pour les tests d'intégration basiques)
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 24,
      lines: 38,
      statements: 37,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout pour les tests
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks entre les tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
